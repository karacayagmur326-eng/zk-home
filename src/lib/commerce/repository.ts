import { randomUUID } from "crypto"
import { query, withTransaction } from "@lib/admin/db"
import { getCached, clearMemoryCache } from "@lib/cache"
import { revalidatePath } from "next/cache"
import { ensureCommerceSchema } from "./schema"

export function createId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function categoryHandle(value: string) {
  return value.split("/").map(slugify).filter(Boolean).join("/")
}

function publicUrl(value: unknown) {
  if (!value) return null
  return String(value)
    .replace(/^https?:\/\/(?:localhost|127\.0\.0\.1):9000\/static\//, "/uploads/")
    .replace(/^\/static\//, "/uploads/")
    .replace(/^\/media\//, "/uploads/")
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function shapeVariant(row: any) {
  const price = number(row.price)
  const original = number(row.compare_at_price, price) || price
  return {
    id: row.id,
    product_id: row.product_id,
    title: row.title || "Standart",
    sku: row.sku,
    barcode: row.barcode,
    allow_backorder: Boolean(row.allow_backorder),
    manage_inventory: Boolean(row.manage_inventory),
    inventory_quantity: number(row.stock),
    thumbnail: publicUrl(row.thumbnail),
    metadata: row.metadata || {},
    rank: number(row.rank),
    prices: [{ amount: price, currency_code: row.currency_code || "try" }],
    calculated_price: {
      calculated_amount: price,
      original_amount: original,
      currency_code: row.currency_code || "try",
      calculated_price: {
        price_list_type: original > price ? "sale" : "default",
      },
    },
    options: row.options || [],
  }
}

export function shapeProduct(row: any) {
  return {
    id: row.id,
    title: row.title,
    handle: row.handle,
    subtitle: row.subtitle || row.metadata?.subtitle || null,
    description: row.description,
    status: row.status,
    thumbnail: publicUrl(row.thumbnail),
    collection_id: row.collection_id,
    collection: row.collection || null,
    type_id: row.type_id,
    type: row.type_id
      ? { id: row.type_id, value: row.type_value || "Ürün" }
      : null,
    discountable: row.discountable,
    weight: row.weight === null ? null : number(row.weight),
    length: row.length === null ? null : number(row.length),
    height: row.height === null ? null : number(row.height),
    width: row.width === null ? null : number(row.width),
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    images: (row.images || []).map((image: any) => ({
      ...image,
      url: publicUrl(image.url),
    })),
    variants: (row.variants || []).map(shapeVariant),
    categories: row.categories || [],
    tags: row.tags || [],
    options: [{ id: `opt_${row.id}`, title: "Varyant", values: [] }],
  }
}

const PRODUCT_SELECT = `
  SELECT p.*,
    CASE WHEN p.collection_id IS NULL THEN NULL ELSE
      jsonb_build_object('id', c.id, 'title', c.title, 'handle', c.handle)
    END AS collection,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id, 'product_id', v.product_id, 'title', v.title, 'sku', v.sku,
        'barcode', v.barcode, 'allow_backorder', v.allow_backorder,
        'manage_inventory', v.manage_inventory, 'stock', v.stock,
        'price', v.price, 'compare_at_price', v.compare_at_price,
        'currency_code', v.currency_code, 'thumbnail', v.thumbnail,
        'metadata', v.metadata, 'rank', v.rank
      ) ORDER BY v.rank, v.created_at)
      FROM store_variant v WHERE v.product_id = p.id
    ), '[]'::jsonb) AS variants,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'url', i.url, 'rank', i.rank, 'metadata', i.metadata
      ) ORDER BY i.rank)
      FROM store_product_image i WHERE i.product_id = p.id
    ), '[]'::jsonb) AS images,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', cat.id, 'name', cat.name, 'handle', cat.handle,
        'description', cat.description, 'parent_category_id', cat.parent_id,
        'metadata', cat.metadata
      ) ORDER BY cat.rank, cat.name)
      FROM store_product_category pc
      JOIN store_category cat ON cat.id = pc.category_id
      WHERE pc.product_id = p.id
    ), '[]'::jsonb) AS categories,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', t.id, 'value', t.value))
      FROM store_product_tag pt
      JOIN store_tag t ON t.id = pt.tag_id
      WHERE pt.product_id = p.id
    ), '[]'::jsonb) AS tags
  FROM store_product p
  LEFT JOIN store_collection c ON c.id = p.collection_id
`

export type ProductFilters = {
  q?: string
  status?: string
  categoryId?: string
  categoryIds?: string[]
  collectionId?: string
  collectionIds?: string[]
  typeId?: string
  ids?: string[]
  handles?: string[]
  tagIds?: string[]
  priceMin?: number
  priceMax?: number
  stock?: string
  limit?: number
  offset?: number
}

export async function listStoreProducts(filters: ProductFilters = {}) {
  await ensureCommerceSchema()
  const cacheKey = `store-products:${JSON.stringify(filters, Object.keys(filters).sort())}`
  return getCached(cacheKey, async () => {
    const where: string[] = []
    const params: unknown[] = []
    const add = (value: unknown) => {
      params.push(value)
      return `$${params.length}`
    }

  if (filters.status === "deleted") {
    where.push(`(p.deleted_at IS NOT NULL OR p.status = 'deleted')`)
  } else {
    where.push(`(p.deleted_at IS NULL AND p.status != 'deleted')`)
    if (filters.status === "published") {
      where.push(`p.status = 'published'`)
    } else if (filters.status === "draft") {
      where.push(`p.status = 'draft'`)
    }
  }

  if (filters.q) {
    const p = add(`%${filters.q}%`)
    where.push(`(p.title ILIKE ${p} OR p.handle ILIKE ${p} OR EXISTS (
      SELECT 1 FROM store_variant sv WHERE sv.product_id = p.id AND sv.sku ILIKE ${p}
    ))`)
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const minTL = filters.priceMin !== undefined && !isNaN(filters.priceMin) ? filters.priceMin : 0
    const maxTL = filters.priceMax !== undefined && !isNaN(filters.priceMax) ? filters.priceMax : 99999999

    const minCents = minTL * 100
    const maxCents = maxTL * 100

    const pMinCents = add(minCents)
    const pMaxCents = add(maxCents)
    const pMinTL = add(minTL)
    const pMaxTL = add(maxTL)

    where.push(`EXISTS (
      SELECT 1 FROM store_variant sv
      WHERE sv.product_id = p.id
        AND sv.price IS NOT NULL
        AND (
          (sv.price >= ${pMinCents} AND sv.price <= ${pMaxCents})
          OR
          (sv.price < 10000 AND sv.price >= ${pMinTL} AND sv.price <= ${pMaxTL})
        )
    )`)
  }
  if (filters.collectionIds?.length)
    where.push(`p.collection_id = ANY(${add(filters.collectionIds)}::text[])`)
  else if (filters.collectionId)
    where.push(`p.collection_id = ${add(filters.collectionId)}`)
  if (filters.typeId) where.push(`p.type_id = ${add(filters.typeId)}`)
  if (filters.categoryIds?.length) {
    where.push(`EXISTS (
      SELECT 1 FROM store_product_category pc
      WHERE pc.product_id = p.id AND pc.category_id = ANY(${add(filters.categoryIds)}::text[])
    )`)
  } else if (filters.categoryId) {
    const pCat = add(filters.categoryId)
    where.push(`EXISTS (
      SELECT 1 FROM store_product_category pc
      WHERE pc.product_id = p.id AND (
        pc.category_id = ${pCat} OR pc.category_id IN (
          WITH RECURSIVE cat_tree AS (
            SELECT id FROM store_category WHERE parent_id = ${pCat}
            UNION ALL
            SELECT c.id FROM store_category c
            JOIN cat_tree ct ON c.parent_id = ct.id
          )
          SELECT id FROM cat_tree
        )
      )
    )`)
  }
  if (filters.ids?.length) where.push(`p.id = ANY(${add(filters.ids)}::text[])`)
  if (filters.handles?.length)
    where.push(`p.handle = ANY(${add(filters.handles)}::text[])`)
  if (filters.tagIds?.length)
    where.push(`EXISTS (
      SELECT 1 FROM store_product_tag pt
      WHERE pt.product_id = p.id AND pt.tag_id = ANY(${add(filters.tagIds)}::text[])
    )`)
  if (filters.stock === "low") {
    where.push(`EXISTS (
      SELECT 1 FROM store_variant sv
      WHERE sv.product_id = p.id AND sv.manage_inventory = TRUE AND sv.stock <= 5
    )`)
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const countRows = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM store_product p ${whereSql}`,
    params
  )

  const [counts] = await query<any>(`
    SELECT
      (SELECT COUNT(*)::int FROM store_product WHERE deleted_at IS NULL AND status != 'deleted') AS total,
      (SELECT COUNT(*)::int FROM store_product WHERE deleted_at IS NULL AND status = 'published') AS published_count,
      (SELECT COUNT(*)::int FROM store_product WHERE deleted_at IS NULL AND status = 'draft') AS draft_count,
      (SELECT COUNT(*)::int FROM store_product WHERE deleted_at IS NULL AND status != 'deleted' AND EXISTS (
        SELECT 1 FROM store_variant sv WHERE sv.product_id = store_product.id AND sv.manage_inventory = TRUE AND sv.stock <= 5
      )) AS low_stock_count,
      (SELECT COUNT(*)::int FROM store_product WHERE deleted_at IS NOT NULL OR status = 'deleted') AS deleted_count
  `)

  const limit = Math.min(Math.max(filters.limit || 100, 1), 500)
  const offset = Math.max(filters.offset || 0, 0)
  const rows = await query<any>(
    `${PRODUCT_SELECT}
     ${whereSql}
     ORDER BY p.created_at DESC
     LIMIT ${add(limit)} OFFSET ${add(offset)}`,
    params
  )
    return {
      products: rows.map(shapeProduct),
      count: countRows[0]?.count || 0,
      counts: counts || { total: 0, published_count: 0, draft_count: 0, low_stock_count: 0, deleted_count: 0 },
    }
  }, 120)
}

export async function getStoreProduct(idOrHandle: string) {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `${PRODUCT_SELECT} WHERE p.id = $1 OR p.handle = $1 LIMIT 1`,
    [idOrHandle]
  )
  return rows[0] ? shapeProduct(rows[0]) : null
}

function firstVariant(body: any) {
  return Array.isArray(body.variants) ? body.variants[0] || {} : {}
}

function priceFrom(body: any, fallback = 0) {
  const variant = firstVariant(body)
  const value = variant.prices?.find(
    (price: any) => String(price.currency_code).toLowerCase() === "try"
  )?.amount
  return number(value, fallback)
}

export async function createStoreProduct(body: any) {
  await ensureCommerceSchema()
  const productId = createId("prod")
  const variantId = createId("var")
  const title = String(body.title || "").trim()
  if (!title) throw new Error("Ürün adı zorunludur.")
  const handle = slugify(body.handle || title) || productId
  const variant = firstVariant(body)
  const sku = String(variant.sku || "").trim()
  if (!sku) throw new Error("Stok kodu (SKU) kullanıcı tarafından girilmelidir.")
  const metadata = { ...(body.metadata || {}) }
  const productPrice = priceFrom(body, 0)
  const requestedStatus = body.status || "draft"

  if (requestedStatus === "published" && productPrice <= 0) {
    throw new Error("Lütfen geçerli bir fiyat girin! Fiyatı 0 TL olan ürünler sitede yayınlanamaz.")
  }
  const finalStatus = productPrice <= 0 ? "draft" : requestedStatus

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO store_product
       (id, title, handle, subtitle, description, status, thumbnail, collection_id,
        type_id, type_value, discountable, weight, length, height, width, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        productId,
        title,
        handle,
        body.subtitle || metadata.subtitle || null,
        body.description || null,
        finalStatus,
        publicUrl(body.thumbnail),
        body.collection_id || null,
        body.type_id || null,
        body.type_value || null,
        body.discountable !== false,
        body.weight || null,
        body.length || null,
        body.height || null,
        body.width || null,
        metadata,
      ]
    )
    await client.query(
      `INSERT INTO store_variant
       (id, product_id, title, sku, barcode, allow_backorder, manage_inventory,
        stock, price, compare_at_price, currency_code, thumbnail, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'try',$11,$12)`,
      [
        variantId,
        productId,
        variant.title || "Standart",
        sku,
        variant.barcode || null,
        Boolean(variant.allow_backorder),
        Boolean(variant.manage_inventory),
        variant.manage_inventory ? number(variant.inventory_quantity) : 999,
        productPrice,
        metadata.original_price ? Math.round(number(metadata.original_price)) : null,
        publicUrl(variant.thumbnail || body.thumbnail),
        variant.metadata || {},
      ]
    )
    for (const [rank, image] of (body.images || []).entries()) {
      const url = publicUrl(image?.url || image)
      if (!url) continue
      await client.query(
        `INSERT INTO store_product_image (id, product_id, url, rank)
         VALUES ($1,$2,$3,$4)`,
        [createId("img"), productId, url, rank]
      )
    }
    for (const category of body.categories || []) {
      if (!category?.id) continue
      await client.query(
        `INSERT INTO store_product_category (product_id, category_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [productId, category.id]
      )
    }
    for (const tag of body.tags || []) {
      if (!tag?.id) continue
      await client.query(
        `INSERT INTO store_product_tag (product_id, tag_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [productId, tag.id]
      )
    }
  })
  return getStoreProduct(productId)
}

export async function updateStoreProduct(id: string, body: any) {
  await ensureCommerceSchema()
  const existing = await getStoreProduct(id)
  if (!existing) return null
  const productId = existing.id
  const variant = firstVariant(body)
  const currentVariant = existing.variants?.[0]
  const sku = String(
    variant.sku !== undefined ? variant.sku : currentVariant?.sku || ""
  ).trim()
  if (!sku) throw new Error("Stok kodu (SKU) kullanıcı tarafından girilmelidir.")
  const metadata =
    body.metadata === undefined
      ? existing.metadata
      : { ...(existing.metadata || {}), ...(body.metadata || {}) }

  const currentPrice = currentVariant?.calculated_price?.calculated_amount ?? currentVariant?.prices?.[0]?.amount ?? 0
  const productPrice = priceFrom(body, currentPrice)
  const requestedStatus = body.status ?? existing.status

  if (requestedStatus === "published" && productPrice <= 0) {
    throw new Error("Lütfen geçerli bir fiyat girin! Fiyatı 0 TL olan ürünler sitede yayınlanamaz.")
  }
  const finalStatus = productPrice <= 0 ? "draft" : requestedStatus

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE store_product SET
       title=$2, handle=$3, subtitle=$4, description=$5, status=$6,
       thumbnail=$7, collection_id=$8, type_id=$9, discountable=$10,
       weight=$11, length=$12, height=$13, width=$14, metadata=$15,
       updated_at=NOW()
       WHERE id=$1`,
      [
        productId,
        body.title ?? existing.title,
        body.handle ? slugify(body.handle) : existing.handle,
        body.subtitle ?? metadata.subtitle ?? existing.subtitle,
        body.description ?? existing.description,
        finalStatus,
        publicUrl(body.thumbnail ?? existing.thumbnail),
        body.collection_id === undefined
          ? existing.collection_id
          : body.collection_id || null,
        body.type_id === undefined ? existing.type_id : body.type_id || null,
        body.discountable ?? existing.discountable,
        body.weight ?? existing.weight,
        body.length ?? existing.length,
        body.height ?? existing.height,
        body.width ?? existing.width,
        metadata,
      ]
    )

    if (variant && (Object.keys(variant).length || !currentVariant)) {
      const variantId = currentVariant?.id || createId("var")
      await client.query(
        `INSERT INTO store_variant
         (id, product_id, title, sku, barcode, allow_backorder, manage_inventory,
          stock, price, compare_at_price, currency_code, thumbnail, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'try',$11,$12)
         ON CONFLICT (id) DO UPDATE SET
          title=EXCLUDED.title, sku=EXCLUDED.sku, barcode=EXCLUDED.barcode,
          allow_backorder=EXCLUDED.allow_backorder,
          manage_inventory=EXCLUDED.manage_inventory, stock=EXCLUDED.stock,
          price=EXCLUDED.price, compare_at_price=EXCLUDED.compare_at_price,
          thumbnail=EXCLUDED.thumbnail, metadata=EXCLUDED.metadata,
          updated_at=NOW()`,
        [
          variantId,
          productId,
          variant.title || currentVariant?.title || "Standart",
          sku,
          variant.barcode ?? currentVariant?.barcode ?? null,
          variant.allow_backorder ?? currentVariant?.allow_backorder ?? false,
          variant.manage_inventory ?? currentVariant?.manage_inventory ?? false,
          variant.inventory_quantity != null
            ? number(variant.inventory_quantity, currentVariant?.inventory_quantity ?? 999)
            : number(currentVariant?.inventory_quantity ?? 999),
          priceFrom(body, currentVariant?.prices?.[0]?.amount || 0),
          metadata.original_price
            ? number(metadata.original_price)
            : currentVariant?.calculated_price?.original_amount || null,
          publicUrl(variant.thumbnail || body.thumbnail || existing.thumbnail),
          variant.metadata || currentVariant?.metadata || {},
        ]
      )
    }

    if (Array.isArray(body.images)) {
      await client.query(`DELETE FROM store_product_image WHERE product_id=$1`, [
        productId,
      ])
      for (const [rank, image] of body.images.entries()) {
        const url = publicUrl(image?.url || image)
        if (!url) continue
        await client.query(
          `INSERT INTO store_product_image (id, product_id, url, rank)
           VALUES ($1,$2,$3,$4)`,
          [createId("img"), productId, url, rank]
        )
      }
    }
    if (Array.isArray(body.categories)) {
      await client.query(
        `DELETE FROM store_product_category WHERE product_id=$1`,
        [productId]
      )
      for (const category of body.categories) {
        if (!category?.id) continue
        await client.query(
          `INSERT INTO store_product_category (product_id, category_id)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [productId, category.id]
        )
      }
    }
    if (Array.isArray(body.tags)) {
      await client.query(`DELETE FROM store_product_tag WHERE product_id=$1`, [
        productId,
      ])
      for (const tag of body.tags) {
        if (!tag?.id) continue
        await client.query(
          `INSERT INTO store_product_tag (product_id, tag_id)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [productId, tag.id]
        )
      }
    }
  })
  return getStoreProduct(productId)
}

export async function deleteStoreProduct(id: string, permanent = false) {
  await ensureCommerceSchema()
  if (permanent) {
    const rows = await query<{ id: string }>(
      `DELETE FROM store_product WHERE id=$1 RETURNING id`,
      [id]
    )
    return Boolean(rows[0])
  }
  const rows = await query<{ id: string }>(
    `UPDATE store_product SET status='deleted', deleted_at=NOW() WHERE id=$1 RETURNING id`,
    [id]
  )
  return Boolean(rows[0])
}

export async function restoreStoreProduct(id: string) {
  await ensureCommerceSchema()
  const rows = await query<{ id: string }>(
    `UPDATE store_product SET status='draft', deleted_at=NULL WHERE id=$1 RETURNING id`,
    [id]
  )
  return Boolean(rows[0])
}

export async function listStoreCategories(activeOnly = false) {
  await ensureCommerceSchema()
  const sql = `WITH RECURSIVE descendants(root_id, id) AS (
       SELECT id, id FROM store_category
       UNION ALL
       SELECT d.root_id, child.id FROM store_category child
       JOIN descendants d ON child.parent_id = d.id
     )
     SELECT c.*,
      COALESCE((
        SELECT COUNT(DISTINCT pc.product_id)
        FROM store_product_category pc
        JOIN store_product p ON p.id = pc.product_id
        WHERE pc.category_id = c.id AND (p.status != 'archived' OR p.status IS NULL)
      ), 0)::int AS direct_product_count,
      COALESCE((
        SELECT COUNT(DISTINCT pc.product_id)
        FROM store_product_category pc
        JOIN store_product p ON p.id = pc.product_id
        WHERE pc.category_id IN (SELECT id FROM descendants WHERE root_id = c.id)
          AND (p.status != 'archived' OR p.status IS NULL)
      ), 0)::int AS product_count,
      EXISTS (
        SELECT 1 FROM store_product_category pc
        JOIN store_product p ON p.id = pc.product_id
        WHERE pc.category_id IN (SELECT id FROM descendants WHERE root_id = c.id)
          AND p.status = 'published'
      ) AS has_products
     FROM store_category c
     ${activeOnly ? "WHERE c.active=TRUE" : ""}
     ORDER BY c.parent_id NULLS FIRST, c.rank, c.created_at`
  const rows = await getCached<any[]>(
    `store-categories:${activeOnly ? "active" : "all"}`,
    () => query<any>(sql),
    300,
  )
  const shaped = rows.map((row) => ({
    id: row.id,
    name: row.name,
    handle: row.handle,
    description: row.description,
    parent_category_id: row.parent_id,
    rank: row.rank,
    is_active: row.active !== false,
    is_internal: false,
    metadata: row.metadata || {},
    product_count: Number(row.product_count || 0),
    direct_product_count: Number(row.direct_product_count || 0),
    created_at: row.created_at,
    products: row.has_products ? [{ id: `category_product_${row.id}` }] : [],
    category_children: [] as any[],
  }))
  const byId = new Map(shaped.map((category) => [category.id, category]))
  for (const category of shaped) {
    if (category.parent_category_id) {
      const parent = byId.get(category.parent_category_id)
      if (parent) {
        parent.category_children.push(category)
        ;(category as typeof category & { parent_category?: Record<string, unknown> }).parent_category = {
          id: parent.id,
          name: parent.name,
          handle: parent.handle,
          metadata: parent.metadata,
          parent_category_id: parent.parent_category_id,
          parent_category: (parent as typeof parent & { parent_category?: Record<string, unknown> }).parent_category,
        }
      }
    }
  }
  return shaped
}

export async function createStoreCategory(body: any) {
  await ensureCommerceSchema()
  const id = createId("pcat")
  const name = String(body.name || "").trim()
  if (!name) throw new Error("Kategori adı zorunludur.")
  const handle = categoryHandle(body.handle || name) || id
  const metadata = {
    ...(body.metadata || {}),
    ...(body.icon !== undefined ? { icon: body.icon } : {}),
  }
  const rows = await query<any>(
    `INSERT INTO store_category
     (id,name,handle,description,parent_id,active,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *, 0::int AS product_count`,
    [
      id,
      name,
      handle,
      body.description || null,
      body.parent_category_id || null,
      body.is_active !== false && body.active !== false,
      metadata,
    ]
  )
  clearMemoryCache()
  try {
    revalidatePath("/", "layout")
  } catch {}

  const row = rows[0]
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    description: row.description,
    parent_category_id: row.parent_id,
    rank: row.rank,
    is_active: row.active !== false,
    is_internal: false,
    metadata: row.metadata || {},
    product_count: 0,
    created_at: row.created_at,
    products: [],
    category_children: [] as any[],
  }
}

export async function updateStoreCategory(id: string, body: any) {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `UPDATE store_category SET
       name=COALESCE($2,name),
       handle=COALESCE($3,handle),
       description=$4,
       parent_id=CASE WHEN $8::boolean THEN $5::text ELSE parent_id END,
       active=COALESCE($6,active),
       metadata=COALESCE(metadata,'{}'::jsonb) || $7::jsonb,
       updated_at=NOW()
     WHERE id=$1 RETURNING *,
       (SELECT COUNT(DISTINCT pc.product_id) FROM store_product_category pc JOIN store_product p ON p.id=pc.product_id WHERE pc.category_id=store_category.id AND (p.status != 'archived' OR p.status IS NULL))::int AS product_count`,
    [
      id,
      body.name || null,
      body.handle ? categoryHandle(body.handle) : null,
      body.description !== undefined ? body.description : null,
      body.parent_category_id !== undefined ? (body.parent_category_id || null) : null,
      body.is_active !== undefined ? Boolean(body.is_active) : (body.active !== undefined ? Boolean(body.active) : null),
      JSON.stringify(
        {
          ...(body.metadata || {}),
          ...(body.icon !== undefined ? { icon: body.icon } : {}),
        }
      ),
      body.parent_category_id !== undefined,
    ]
  )
  clearMemoryCache()
  try {
    revalidatePath("/", "layout")
  } catch {}

  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    description: row.description,
    parent_category_id: row.parent_id,
    rank: row.rank,
    is_active: row.active !== false,
    is_internal: false,
    metadata: row.metadata || {},
    product_count: Number(row.product_count || 0),
    created_at: row.created_at,
    products: [{ id: `category_product_${row.id}` }],
    category_children: [] as any[],
  }
}

export async function deleteStoreCategory(id: string) {
  await ensureCommerceSchema()
  const children = await query<{ id: string }>(
    `SELECT id FROM store_category WHERE parent_id=$1 LIMIT 1`, [id]
  )
  if (children.length) throw new Error("Önce bu kategorinin alt kategorilerini silin veya başka bir üst kategoriye taşıyın.")
  const rows = await query<{ id: string }>(
    `DELETE FROM store_category WHERE id=$1 RETURNING id`,
    [id]
  )
  clearMemoryCache()
  try {
    revalidatePath("/", "layout")
  } catch {}
  return Boolean(rows[0])
}

// ----------------------------------------------------
// COUPON MANAGEMENT REPOSITORY
// ----------------------------------------------------
export async function getStoreCoupons() {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `SELECT * FROM store_coupon ORDER BY created_at DESC`
  )
  return rows
}

export async function getStoreCouponByCode(code: string) {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `SELECT * FROM store_coupon WHERE UPPER(code) = UPPER($1) AND is_active = TRUE LIMIT 1`,
    [code.trim()]
  )
  return rows[0] || null
}

export async function createStoreCoupon(data: {
  code: string
  type: "percentage" | "fixed"
  value: number
  min_subtotal?: number
  is_active?: boolean
  usage_limit?: number | null
  starts_at?: string | null
  ends_at?: string | null
  description?: string | null
}) {
  await ensureCommerceSchema()
  const id = createId("cpn")
  const formattedCode = data.code.trim().toUpperCase()
  const rows = await query<any>(
    `INSERT INTO store_coupon (id, code, type, value, min_subtotal, is_active, usage_limit, starts_at, ends_at, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      formattedCode,
      data.type || "percentage",
      Number(data.value) || 0,
      Number(data.min_subtotal) || 0,
      data.is_active !== undefined ? Boolean(data.is_active) : true,
      data.usage_limit ? Number(data.usage_limit) : null,
      data.starts_at || new Date().toISOString(),
      data.ends_at || null,
      data.description || null,
    ]
  )
  return rows[0]
}

export async function updateStoreCoupon(id: string, data: {
  code?: string
  type?: "percentage" | "fixed"
  value?: number
  min_subtotal?: number
  is_active?: boolean
  usage_limit?: number | null
  starts_at?: string | null
  ends_at?: string | null
  description?: string | null
}) {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `UPDATE store_coupon SET
       code = COALESCE($2, code),
       type = COALESCE($3, type),
       value = COALESCE($4, value),
       min_subtotal = COALESCE($5, min_subtotal),
       is_active = COALESCE($6, is_active),
       usage_limit = $7,
       starts_at = COALESCE($8, starts_at),
       ends_at = $9,
       description = COALESCE($10, description),
       updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.code ? data.code.trim().toUpperCase() : null,
      data.type || null,
      data.value !== undefined ? Number(data.value) : null,
      data.min_subtotal !== undefined ? Number(data.min_subtotal) : null,
      data.is_active !== undefined ? Boolean(data.is_active) : null,
      data.usage_limit !== undefined ? (data.usage_limit ? Number(data.usage_limit) : null) : null,
      data.starts_at || null,
      data.ends_at || null,
      data.description || null,
    ]
  )
  return rows[0] || null
}

export async function deleteStoreCoupon(id: string) {
  await ensureCommerceSchema()
  const rows = await query<{ id: string }>(
    `DELETE FROM store_coupon WHERE id = $1 RETURNING id`,
    [id]
  )
  return Boolean(rows[0])
}

/**
 * Gerçek checkout sırasında çağrılır. usage_count'u 1 artırır.
 * Limit kontrolü de yapar - limitee ulaşıldıysa hata fırlatır.
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  await ensureCommerceSchema()
  const result = await query<any>(
    `UPDATE store_coupon
     SET usage_count = usage_count + 1, updated_at = NOW()
     WHERE UPPER(code) = UPPER($1)
       AND is_active = TRUE
       AND (usage_limit IS NULL OR usage_count < usage_limit)
     RETURNING id, usage_count, usage_limit`,
    [code.trim()]
  )
  if (!result.length) {
    // Either coupon not found, inactive, or limit reached — silently skip
    console.warn(`[coupon] Could not increment usage for code: ${code}`)
  }
}

// ----------------------------------------------------
// CAMPAIGN MANAGEMENT REPOSITORY
// ----------------------------------------------------

export type CampaignStatus = "active" | "planned" | "completed" | "draft"
export type CampaignType = "discount" | "shipping" | "loyalty" | "gift" | "other"

export async function getStoreCampaigns() {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `SELECT * FROM store_campaign ORDER BY created_at DESC`
  )
  return rows
}

export async function getStoreCampaignById(id: string) {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `SELECT * FROM store_campaign WHERE id = $1 LIMIT 1`,
    [id]
  )
  return rows[0] || null
}

export async function createStoreCampaign(data: {
  name: string
  description?: string | null
  type?: CampaignType
  status?: CampaignStatus
  starts_at?: string | null
  ends_at?: string | null
  discount_type?: string | null
  discount_value?: number | null
  min_subtotal?: number | null
}) {
  await ensureCommerceSchema()
  const id = createId("cmpn")
  const rows = await query<any>(
    `INSERT INTO store_campaign
     (id, name, description, type, status, starts_at, ends_at, discount_type, discount_value, min_subtotal)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      data.name.trim(),
      data.description?.trim() || null,
      data.type || "discount",
      data.status || "draft",
      data.starts_at || new Date().toISOString(),
      data.ends_at || null,
      data.discount_type || null,
      data.discount_value !== undefined ? Number(data.discount_value) : null,
      data.min_subtotal !== undefined ? Number(data.min_subtotal) : 0,
    ]
  )
  return rows[0]
}

export async function updateStoreCampaign(id: string, data: {
  name?: string
  description?: string | null
  type?: CampaignType
  status?: CampaignStatus
  starts_at?: string | null
  ends_at?: string | null
  discount_type?: string | null
  discount_value?: number | null
  min_subtotal?: number | null
}) {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `UPDATE store_campaign SET
       name = COALESCE($2, name),
       description = COALESCE($3, description),
       type = COALESCE($4, type),
       status = COALESCE($5, status),
       starts_at = COALESCE($6, starts_at),
       ends_at = $7,
       discount_type = $8,
       discount_value = COALESCE($9, discount_value),
       min_subtotal = COALESCE($10, min_subtotal),
       updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.name?.trim() || null,
      data.description !== undefined ? data.description?.trim() || null : undefined,
      data.type || null,
      data.status || null,
      data.starts_at || null,
      data.ends_at || null,
      data.discount_type !== undefined ? data.discount_type : undefined,
      data.discount_value !== undefined ? Number(data.discount_value) : null,
      data.min_subtotal !== undefined ? Number(data.min_subtotal) : null,
    ]
  )
  return rows[0] || null
}

export async function deleteStoreCampaign(id: string) {
  await ensureCommerceSchema()
  const rows = await query<{ id: string }>(
    `DELETE FROM store_campaign WHERE id = $1 RETURNING id`,
    [id]
  )
  return Boolean(rows[0])
}
