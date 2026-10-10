"use server"

import { HttpTypes } from "@medusajs/types"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"

export const retrieveCollection = async (id: string) => {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `SELECT * FROM store_collection WHERE id=$1 LIMIT 1`,
    [id]
  )
  return (rows[0] || null) as HttpTypes.StoreCollection | null
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  await ensureCommerceSchema()
  const limit = Math.min(Number(queryParams.limit || 100), 500)
  const offset = Number(queryParams.offset || 0)
  const rows = await query<any>(
    `SELECT * FROM store_collection ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const count = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM store_collection`
  )
  return {
    collections: rows as HttpTypes.StoreCollection[],
    count: count[0]?.count || 0,
  }
}

export const getCollectionByHandle = async (handle: string) => {
  await ensureCommerceSchema()
  const rows = await query<any>(
    `SELECT c.*,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'handle',p.handle))
         FROM store_product p WHERE p.collection_id=c.id AND p.status='published' AND p.deleted_at IS NULL
       ), '[]'::jsonb) AS products
     FROM store_collection c WHERE c.handle=$1 OR c.metadata->'slug_history' ? $1 ORDER BY (c.handle=$1) DESC LIMIT 1`,
    [handle]
  )
  return (rows[0] || null) as HttpTypes.StoreCollection | null
}
