import { NextRequest, NextResponse } from "next/server"

import { query, withTransaction } from "@lib/admin/db"
import { getCustomerSessionId } from "@lib/commerce/customer-auth"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { convertToLocale } from "@lib/util/money"

type FavoriteInput = {
  id?: unknown
  variantId?: unknown
}

type FavoriteRow = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  variant_id: string | null
  price_amount: string | number | null
}

function formatPrice(value: string | number | null) {
  if (value === null || value === undefined) return null
  return convertToLocale({ amount: Number(value), currency_code: "TRY" })
}

async function listFavorites(customerId: string) {
  const rows = await query<FavoriteRow>(
    `SELECT p.id,p.title,p.handle,p.thumbnail,
            selected_variant.id AS variant_id,
            selected_variant.price AS price_amount
     FROM store_customer_favorite f
     JOIN store_product p ON p.id=f.product_id AND p.status='published'
     LEFT JOIN LATERAL (
       SELECT v.id,v.price
       FROM store_variant v
       WHERE v.product_id=p.id
       ORDER BY (v.id=f.variant_id) DESC,v.created_at
       LIMIT 1
     ) selected_variant ON TRUE
     WHERE f.customer_id=$1
     ORDER BY f.created_at DESC`,
    [customerId]
  )

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    handle: row.handle,
    thumbnail: row.thumbnail,
    variantId: row.variant_id,
    price: formatPrice(row.price_amount),
  }))
}

function normalizeFavorites(value: unknown) {
  if (!Array.isArray(value)) return []

  const unique = new Map<
    string,
    { productId: string; variantId: string | null }
  >()

  for (const item of value.slice(0, 100) as FavoriteInput[]) {
    const productId = typeof item?.id === "string" ? item.id.trim() : ""
    const variantId =
      typeof item?.variantId === "string" ? item.variantId.trim() : null
    if (productId) unique.set(productId, { productId, variantId })
  }

  return [...unique.values()]
}

export async function GET() {
  await ensureCommerceSchema()
  const customerId = await getCustomerSessionId()
  if (!customerId) {
    return NextResponse.json({ favorites: [], authenticated: false })
  }

  return NextResponse.json({ favorites: await listFavorites(customerId) })
}

export async function POST(request: NextRequest) {
  await ensureCommerceSchema()
  const customerId = await getCustomerSessionId()
  if (!customerId) {
    return NextResponse.json({ favorites: [], authenticated: false })
  }

  const body = await request.json().catch(() => ({}))
  const favorites = normalizeFavorites(body?.favorites)

  if (favorites.length) {
    await withTransaction(async (client) => {
      for (const favorite of favorites) {
        await client.query(
          `INSERT INTO store_customer_favorite
             (customer_id,product_id,variant_id)
           SELECT $1,p.id,
                  CASE WHEN EXISTS (
                    SELECT 1 FROM store_variant v
                    WHERE v.id=$3 AND v.product_id=p.id
                  ) THEN $3 ELSE (
                    SELECT v.id FROM store_variant v
                    WHERE v.product_id=p.id
                    ORDER BY v.created_at LIMIT 1
                  ) END
           FROM store_product p
           WHERE p.id=$2 AND p.status='published'
           ON CONFLICT (customer_id,product_id) DO UPDATE SET
             variant_id=COALESCE(EXCLUDED.variant_id,store_customer_favorite.variant_id),
             updated_at=NOW()`,
          [customerId, favorite.productId, favorite.variantId]
        )
      }
    })
  }

  return NextResponse.json({ favorites: await listFavorites(customerId) })
}

export async function DELETE(request: NextRequest) {
  await ensureCommerceSchema()
  const customerId = await getCustomerSessionId()
  if (!customerId) {
    return NextResponse.json({ favorites: [], authenticated: false })
  }

  const productId = request.nextUrl.searchParams.get("productId")?.trim()
  if (!productId) {
    return NextResponse.json(
      { error: "Silinecek ürün belirtilmedi." },
      { status: 400 }
    )
  }

  await query(
    `DELETE FROM store_customer_favorite
     WHERE customer_id=$1 AND product_id=$2`,
    [customerId, productId]
  )

  return NextResponse.json({ favorites: await listFavorites(customerId) })
}
