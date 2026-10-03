import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { createId, createStoreProduct, listStoreCategories, slugify } from "@lib/commerce/repository"
import { flushAllSiteCache } from "@lib/cache"
import { normalizedName, normalizedSku } from "@lib/commerce/import-catalog"
import { ensureCommerceSchema } from "@lib/commerce/schema"

const rowSchema = z.object({
  sourceRow:z.number().int().positive(), sku:z.string().trim().min(1).max(200),title:z.string().trim().min(1).max(500),
  brand:z.string().trim().max(200),categories:z.array(z.string().trim().min(1).max(300)).max(100),
  stock:z.number().int().nonnegative().nullable(),regularPrice:z.number().finite().nonnegative(),salePrice:z.number().finite().positive().nullable(),
  summary:z.string().max(50000),description:z.string().max(100000),features:z.string().max(50000),barcode:z.string().max(200),
})
const escapeHtml = (text:string) => text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/\r?\n/g,"<br />")
const descriptionHtml = (text:string) => text.split(/\r?\n/).map(line => {
  const label = /^([^:]{1,80}):/.exec(line)
  return label ? `<strong>${escapeHtml(label[0])}</strong>${escapeHtml(line.slice(label[0].length))}` : escapeHtml(line)
}).join("<br />")

async function categoryResolution(names:string[]) {
  const categories = await listStoreCategories(false)
  const ids:string[] = [], issues:string[] = []
  for (const name of names) {
    const matches = categories.filter(category => normalizedName(category.name) === normalizedName(name))
    if (matches.length !== 1) issues.push(matches.length ? `Kategori adı belirsiz: ${name}` : `Kategori bulunamadı: ${name}`)
    else ids.push(matches[0].id)
  }
  return {ids:[...new Set(ids)],issues}
}

export async function POST(req:NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({error:"Yetkisiz işlem."},{status:401})
  try {
    const body = await req.json()
    await ensureCommerceSchema()
    if (body.action === "preview") {
      const rows = z.array(rowSchema).max(5000).parse(body.rows)
      const skuKeys = rows.map(row => normalizedSku(row.sku))
      const existing = await query<{sku:string}>(`SELECT v.sku FROM store_variant v JOIN store_product p ON p.id=v.product_id WHERE upper(trim(v.sku))=ANY($1::text[])`,[skuKeys])
      const names = [...new Set(rows.flatMap(row => row.categories))]
      const resolved = await categoryResolution(names)
      const categoryIssuesByRow:Record<number,string[]> = {}
      for (const row of rows) {
        const issues = resolved.issues.filter(issue=>row.categories.some(name=>issue.endsWith(`: ${name}`)))
        if (issues.length) categoryIssuesByRow[row.sourceRow]=issues
      }
      return NextResponse.json({existingSkus:existing.map(row=>normalizedSku(row.sku)),categoryIssuesByRow})
    }
    const row = rowSchema.parse(body.row)
    const status = z.enum(["draft","published"]).parse(body.status)
    const imageIds = z.array(z.string().min(1).max(200)).min(1).max(100).parse(body.imageIds)
    // SKU is compared as text. Existing products are never overwritten by this import.
    const existing = await query<{id:string}>(`SELECT p.id FROM store_product p JOIN store_variant v ON v.product_id=p.id WHERE upper(trim(v.sku))=$1 LIMIT 1`,[normalizedSku(row.sku)])
    if(existing.length) return NextResponse.json({success:true,skipped:true,productId:existing[0].id})
    const categories = await categoryResolution(row.categories)
    if(categories.issues.length) return NextResponse.json({error:categories.issues.join(" · ")},{status:400})
    const media = await query<{id:string;url:string}>(`SELECT id,url FROM store_media WHERE id=ANY($1::text[]) AND deleted_at IS NULL`,[imageIds])
    const byId = new Map(media.map(item=>[item.id,item.url]))
    if(imageIds.some(id=>!byId.has(id))) return NextResponse.json({error:"Ürünün tüm görselleri yüklenmeli."},{status:400})
    const images = [...new Set(imageIds.map(id=>byId.get(id)!))]
    const price = row.salePrice ?? row.regularPrice
    if(status === "published" && price <= 0) return NextResponse.json({error:"Yayınlamak için geçerli bir fiyat girin."},{status:400})
    let brandId:string|undefined
    if(row.brand) {
      const brands = await query<{id:string;title:string}>("SELECT id,title FROM store_collection")
      brandId = brands.find(brand=>normalizedName(brand.title)===normalizedName(row.brand))?.id
      if(!brandId) {
        const inserted = await query<{id:string}>(`INSERT INTO store_collection (id,title,handle,metadata) VALUES ($1,$2,$3,$4::jsonb) ON CONFLICT(handle) DO UPDATE SET handle=EXCLUDED.handle RETURNING id`,[createId("pcol"),row.brand,slugify(row.brand),JSON.stringify({source:"excel"})])
        brandId=inserted[0].id
      }
    }
    const product = await createStoreProduct({
      title:row.title,handle:`${slugify(row.title).slice(0,70)}-${slugify(row.sku).slice(0,45)}`,status,
      description:descriptionHtml(row.description),collection_id:brandId,thumbnail:images[0],images:images.map(url=>({url})),
      categories:categories.ids.map(id=>({id})),
      variants:[{title:"Standart",sku:row.sku,barcode:row.barcode || undefined,manage_inventory:row.stock!==null,inventory_quantity:row.stock??999,prices:[{amount:Math.round(price*100),currency_code:"try"}]}],
      metadata:{brand:row.brand,original_price:row.salePrice!==null && row.regularPrice>price ? Math.round(row.regularPrice*100):null,product_summary:descriptionHtml(row.summary),features_content:descriptionHtml(row.features),source:"excel",source_row:row.sourceRow},
    })
    await flushAllSiteCache()
    return NextResponse.json({success:true,productId:product?.id})
  } catch(error) {
    return NextResponse.json({error:error instanceof z.ZodError ? "Satır alanları veya görsel seçimi geçersiz." : error instanceof Error ? error.message : "İçe aktarma başarısız."},{status:400})
  }
}
