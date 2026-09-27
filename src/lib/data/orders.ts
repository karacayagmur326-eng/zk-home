"use server"

import { HttpTypes } from "@medusajs/types"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import {
  getCustomerSessionId,
  getRecentOrderAccessId,
} from "@lib/commerce/customer-auth"

async function getOrder(id: string, customerId?: string | null) {
  await ensureCommerceSchema()
  const params: unknown[] = [id]
  let owner = ""
  if (customerId) {
    params.push(customerId)
    owner = `AND (o.customer_id=$2 OR LOWER(o.email) = (SELECT LOWER(email) FROM store_customer WHERE id=$2))`
  }
  const rows = await query<any>(
    `SELECT o.*, o.delivered_at,
       (
         SELECT jsonb_build_object(
           'id', inv.id,
           'invoice_number', inv.invoice_number,
           'pdf_url', inv.pdf_url,
           'status', inv.status,
           'created_at', inv.created_at
         )
         FROM store_invoice inv
         WHERE inv.order_id=o.id
         ORDER BY inv.created_at DESC
         LIMIT 1
       ) AS invoice,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object(
           'id',i.id,'product_id',i.product_id,'variant_id',i.variant_id,
           'title',i.title,'product_title',i.title,'thumbnail',i.thumbnail,
           'quantity',i.quantity,'unit_price',i.unit_price,'total',i.total,
           'variant',jsonb_build_object(
             'id',i.variant_id,'sku',i.sku,
             'title',COALESCE(sv.title, ''),
             'product_id',i.product_id
           ),
           'product',jsonb_build_object('id',i.product_id,'title',i.title)
         ))
         FROM store_order_item i
         LEFT JOIN store_variant sv ON sv.id=i.variant_id
         WHERE i.order_id=o.id
       ),'[]'::jsonb) AS items
     FROM store_order o WHERE o.id=$1 ${owner} LIMIT 1`,
    params
  )
  return rows[0] || null
}

export const retrieveOrder = async (id: string) => {
  const customerId = await getCustomerSessionId()
  if (customerId) {
    return (await getOrder(id, customerId)) as HttpTypes.StoreOrder
  }

  // Misafir siparişleri yalnızca ödeme sonrasında oluşturulan, imzalı ve kısa
  // ömürlü erişim çereziyle görülebilir. Aksi halde sipariş kimliğini bilen biri
  // müşteri/fatura bilgilerine erişebilirdi.
  const recentOrderId = await getRecentOrderAccessId()
  if (recentOrderId !== id) return null
  return (await getOrder(id)) as HttpTypes.StoreOrder
}

export const listOrders = async (limit = 10, offset = 0) => {
  await ensureCommerceSchema()
  const customerId = await getCustomerSessionId()
  if (!customerId) return []
  const cust = await query<{ email: string }>(`SELECT email FROM store_customer WHERE id=$1`, [customerId])
  const email = cust[0]?.email || ""

  if (email) {
    await query(
      `UPDATE store_order SET customer_id=$1 WHERE (customer_id IS NULL OR customer_id <> $1) AND LOWER(email)=LOWER($2)`,
      [customerId, email]
    ).catch(() => {})
  }

  const orders = await query<any>(
    `SELECT o.*, o.delivered_at,
       (
         SELECT jsonb_build_object(
           'id', inv.id, 'invoice_number', inv.invoice_number,
           'pdf_url', inv.pdf_url, 'status', inv.status,
           'created_at', inv.created_at
         )
         FROM store_invoice inv
         WHERE inv.order_id=o.id
         ORDER BY inv.created_at DESC LIMIT 1
       ) AS invoice,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object(
           'id',i.id,'product_id',i.product_id,'variant_id',i.variant_id,
           'title',i.title,'product_title',i.title,'thumbnail',i.thumbnail,
           'quantity',i.quantity,'unit_price',i.unit_price,'total',i.total,
           'variant',jsonb_build_object(
             'id',i.variant_id,'sku',i.sku,'title',COALESCE(sv.title, ''),
             'product_id',i.product_id
           ),
           'product',jsonb_build_object('id',i.product_id,'title',i.title)
         ) ORDER BY i.id ASC)
         FROM store_order_item i
         LEFT JOIN store_variant sv ON sv.id=i.variant_id
         WHERE i.order_id=o.id
       ),'[]'::jsonb) AS items
     FROM store_order o
     WHERE o.customer_id=$1 OR (LOWER(o.email) = LOWER($2) AND $2 <> '')
     ORDER BY COALESCE(o.created_at, NOW()) DESC LIMIT $3 OFFSET $4`,
    [customerId, email, limit, offset]
  )
  return orders as HttpTypes.StoreOrder[]
}

export type TransferRequestState = {
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}

export const createTransferRequest = async (
  _state: TransferRequestState,
  formData: FormData
): Promise<TransferRequestState> => {
  const order = await retrieveOrder(String(formData.get("order_id") || ""))
  return order
    ? { success: true, error: null, order }
    : { success: false, error: "Sipariş bulunamadı.", order: null }
}

export const acceptTransferRequest = async (id: string, _token: string) => ({
  success: Boolean(await retrieveOrder(id)),
  error: null,
  order: await retrieveOrder(id),
})

export const declineTransferRequest = async (id: string, _token: string) => ({
  success: Boolean(await retrieveOrder(id)),
  error: null,
  order: await retrieveOrder(id),
})
