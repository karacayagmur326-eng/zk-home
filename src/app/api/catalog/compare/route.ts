import { NextRequest, NextResponse } from "next/server"
import { listStoreProducts } from "@lib/commerce/repository"
import { query } from "@lib/admin/db"
import { formatTryPrice } from "@lib/util/money"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(`compare:${requestIp(req)}`, 120, 60)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Çok fazla karşılaştırma isteği yapıldı." }, { status: 429 })
  }
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get("ids")?.trim().slice(0, 1600) || ""

  if (!idsParam) {
    return NextResponse.json({ products: [] })
  }

  const idList = idsParam.split(",").map((i) => i.trim().slice(0, 128)).filter(Boolean).slice(0, 12)

  try {
    const { products } = await listStoreProducts({
      limit: 50,
    })

    // Filter to requested products
    const matched = products.filter((p) => idList.includes(p.id) || idList.includes(p.handle))

    // Fetch live ratings and review counts from database table
    const reviewsData = await query<{
      product_id: string
      cnt: string
      avg_rating: string
    }>(
      `SELECT product_id, COUNT(*)::text AS cnt, AVG(rating)::text AS avg_rating
       FROM product_reviews
       WHERE status = 'approved'
       GROUP BY product_id`
    ).catch(() => [])

    const reviewMap = new Map(
      reviewsData.map((r) => [
        r.product_id,
        {
          count: parseInt(r.cnt, 10) || 0,
          avg: parseFloat(r.avg_rating) ? Math.round(parseFloat(r.avg_rating) * 10) / 10 : 0,
        },
      ])
    )

    const shaped = matched.map((p: any) => {
      const variant = p.variants?.[0]
      const rawPrice =
        variant?.calculated_price?.calculated_amount ??
        variant?.prices?.[0]?.amount ??
        0

      const priceInTL = rawPrice / 100

      const formattedPrice = priceInTL > 0 ? formatTryPrice(priceInTL) : "—"

      const md = (p.metadata as Record<string, any>) || {}
      const revInfo = reviewMap.get(p.id) || {
        count: md.review_count !== undefined ? Number(md.review_count) : 0,
        avg: md.rating ? Number(md.rating) : 0,
      }

      // Extract dynamic product options as specs (e.g. Voltaj, Akü, Renk, Beden, Güç, Devir)
      const dynamicOptionsSpecs: Array<{ key: string; value: string }> = []
      if (p.options && p.options.length > 0) {
        p.options.forEach((opt: any) => {
          if (opt.title && opt.values?.length) {
            const vals = Array.from(new Set(opt.values.map((v: any) => v.value).filter(Boolean))).join(", ")
            if (vals) dynamicOptionsSpecs.push({ key: opt.title, value: vals })
          }
        })
      }

      const invQty = variant?.inventory_quantity
      const inStock = invQty !== undefined && invQty !== null ? invQty > 0 : true

      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail || variant?.thumbnail || p.images?.[0]?.url || "/brand/zkhome-logo.svg",
        price: priceInTL,
        formatted_price: formattedPrice,
        category: p.categories?.[0]?.name || md.category_name || p.type?.value || "—",
        brand: md.brand_name || p.collection?.title || "ZK Home",
        sku: variant?.sku || md.sku || "—",
        model: md.model_name || p.title,
        power: md.power || dynamicOptionsSpecs.find((s) => s.key.toLowerCase().includes("güç") || s.key.toLowerCase().includes("volt"))?.value || "—",
        stock_status: inStock ? "Stokta Var" : "Stokta Yok",
        shipping_time: md.shipping_time || "1-3 İş Günü",
        warranty: md.warranty || "Ürün bazında belirtilir",
        installment: md.installment || "Var",
        rating: revInfo.avg > 0 ? revInfo.avg : "4.8",
        reviews_count: revInfo.count,
        tech_specs: Array.isArray(md.tech_specs) ? md.tech_specs : dynamicOptionsSpecs,
        box_content: Array.isArray(md.box_content) ? md.box_content : md.package_content || [],
      }
    })

    return NextResponse.json({ products: shaped })
  } catch (err: any) {
    console.error("Compare API error:", err)
    return NextResponse.json({ error: "Karşılaştırma şu anda tamamlanamadı." }, { status: 500 })
  }
}
