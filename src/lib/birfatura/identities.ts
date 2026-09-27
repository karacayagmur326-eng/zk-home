import { query } from "@lib/admin/db"
import type { RawOrder } from "./mapper"

function productKey(item: NonNullable<RawOrder["items"]>[number]): string {
  return `product:${item.product_id || item.variant_id || item.id}`
}

/** Database-backed, collision-free IDs. Never use parseInt(UUID), hashes or array indexes. */
export async function assignBirFaturaIdentities(orders: RawOrder[]): Promise<RawOrder[]> {
  const keys = [...new Set(orders.flatMap(order => [
    ...(order.customer_id ? [`customer:${order.customer_id}`] : []),
    ...(order.items || []).map(productKey),
  ]))].sort()
  if (!keys.length) return orders

  await query(
    `INSERT INTO store_birfatura_identity (source_key)
     SELECT key FROM unnest($1::text[]) AS input(key) ORDER BY key
     ON CONFLICT (source_key) DO NOTHING`,
    [keys]
  )
  // Separate statement sees rows inserted by concurrent requests after conflict waits.
  const rows = await query<{ source_key: string; external_id: string }>(
    `SELECT source_key, external_id FROM store_birfatura_identity WHERE source_key = ANY($1::text[])`,
    [keys]
  )
  const ids = new Map(rows.map(row => [row.source_key, Number(row.external_id)]))
  function getId(key: string): number {
    const id = ids.get(key)
    if (!id || !Number.isSafeInteger(id)) throw new Error("BIRFATURA_ID_MAPPING_FAILED")
    return id
  }
  return orders.map(order => ({
    ...order,
    birfatura_customer_id: order.customer_id ? getId(`customer:${order.customer_id}`) : undefined,
    items: (order.items || []).map(item => ({ ...item, birfatura_product_id: getId(productKey(item)) })),
  }))
}
