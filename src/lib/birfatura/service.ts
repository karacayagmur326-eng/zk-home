import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getSqlConditionsForBirFaturaStatus } from "./constants"
import { mapOrderToBirFatura, RawOrder } from "./mapper"
import { parseBirFaturaDate } from "./schemas"
import { assignBirFaturaIdentities } from "./identities"
import { BirFaturaCargoUpdateRequest, BirFaturaInvoiceLinkUpdateRequest, BirFaturaOrder } from "./types"

import { getBaseURL } from "@lib/util/env"

/**
 * Mağaza genel KDV ve URL ayarlarını getirir.
 */
async function getStoreTaxSettings(): Promise<{ defaultVatRate: number; websiteUrl: string }> {
  const websiteUrl = getBaseURL()
  try {
    const rows = await query<any>(`SELECT value FROM store_setting WHERE key='commerce' LIMIT 1`)
    const val = rows[0]?.value || {}
    const defaultVatRate = Number(val.tax_settings?.vatRate) || 20
    return { defaultVatRate, websiteUrl }
  } catch {
    return {
      defaultVatRate: 20,
      websiteUrl,
    }
  }
}

/**
 * 1. BirFatura Siparişlerini Getirir
 */
export async function getBirFaturaOrdersList(filters: {
  orderStatusId?: number
  startDateTime?: string
  endDateTime?: string
}): Promise<BirFaturaOrder[]> {
  await ensureCommerceSchema()
  const { defaultVatRate, websiteUrl } = await getStoreTaxSettings()

  const { statusCondition } = getSqlConditionsForBirFaturaStatus(filters.orderStatusId)

  const whereConditions: string[] = [statusCondition]
  const params: unknown[] = []

  // Tarih filtreleri
  if (filters.startDateTime) {
    const startDate = parseBirFaturaDate(filters.startDateTime)
    if (startDate) {
      params.push(startDate.toISOString())
      whereConditions.push(`o.created_at >= $${params.length}`)
    }
  }

  if (filters.endDateTime) {
    const endDate = parseBirFaturaDate(filters.endDateTime)
    if (endDate) {
      params.push(endDate.toISOString())
      whereConditions.push(`o.created_at <= $${params.length}`)
    }
  }

  const whereSql = whereConditions.length ? `WHERE ${whereConditions.join(" AND ")}` : ""

  const sql = `
    SELECT o.*,
      (SELECT c.phone FROM store_customer c WHERE c.id = o.customer_id) AS customer_phone,
      COALESCE((
        SELECT p.provider_id FROM store_payment p
        WHERE p.order_id = o.id
        ORDER BY p.created_at DESC LIMIT 1
      ), o.metadata->>'payment_provider_id') AS payment_provider_id,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'variant_id', oi.variant_id,
          'title', oi.title,
          'thumbnail', oi.thumbnail,
          'sku', oi.sku,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total', oi.total,
          'metadata', oi.metadata,
          'variant', jsonb_build_object(
            'id', sv.id,
            'title', sv.title,
            'sku', sv.sku,
            'barcode', sv.barcode,
            'metadata', sv.metadata
          ),
          'product', jsonb_build_object(
            'id', sp.id,
            'title', sp.title,
            'metadata', sp.metadata
          )
        ))
        FROM store_order_item oi
        LEFT JOIN store_variant sv ON sv.id = oi.variant_id
        LEFT JOIN store_product sp ON sp.id = oi.product_id
        WHERE oi.order_id = o.id
      ), '[]'::jsonb) AS items
    FROM store_order o
    ${whereSql}
    ORDER BY o.created_at ASC
  `

  const rows = await query<RawOrder>(sql, params)
  const mappedRows = await assignBirFaturaIdentities(rows)
  return mappedRows.map((order) => mapOrderToBirFatura(order, defaultVatRate, websiteUrl))
}

/**
 * 2. BirFatura Kargo Takip Bilgisi Güncelleme (Idempotent & Transactional)
 * YALNIZCA store_order.display_id üzerinden eşleştirilir!
 */
export async function updateBirFaturaCargoTracking(
  payload: BirFaturaCargoUpdateRequest
): Promise<{ success: boolean; orderId: number; message: string }> {
  await ensureCommerceSchema()

  return await withTransaction(async (client) => {
    // 1. Siparişi display_id ile bul
    const orderRes = await client.query(
      `SELECT id, display_id, status, fulfillment_status, shipping_carrier, tracking_number, tracking_url
       FROM store_order
       WHERE display_id = $1
       FOR UPDATE`,
      [payload.orderId]
    )

    if (!orderRes.rows.length) {
      throw new Error(`ORDER_NOT_FOUND`)
    }

    const order = orderRes.rows[0]
    const carrier = payload.cargoCompany || order.shipping_carrier || "Kargo"
    const trackingCode = payload.cargoTrackingCode
    const trackingUrl = payload.cargoTrackingCodeUrl || ""

    // 2. Siparişi güncelle (İptal edilmiş siparişin status'unu ezme, değilse 'shipped' yap)
    await client.query(
      `UPDATE store_order
       SET shipping_carrier = COALESCE(NULLIF($2, ''), shipping_carrier),
           tracking_number = $3,
           tracking_url = COALESCE(NULLIF($4, ''), tracking_url),
           fulfillment_status = 'shipped',
           status = CASE WHEN status = 'cancelled' THEN status ELSE 'shipped' END,
           updated_at = NOW()
       WHERE id = $1`,
      [order.id, carrier, trackingCode, trackingUrl]
    )

    // 3. Sipariş durum tarihçesine idempotent ekle
    const historyNote = `BirFatura Kargo Güncellemesi: ${carrier} - Takip No: ${trackingCode}`
    const existingHistory = await client.query(
      `SELECT id FROM store_order_status_history
       WHERE order_id = $1 AND note = $2 LIMIT 1`,
      [order.id, historyNote]
    )

    if (!existingHistory.rows.length) {
      const historyId = `osh_bf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await client.query(
        `INSERT INTO store_order_status_history (id, order_id, status, note, created_at)
         VALUES ($1, $2, 'shipped', $3, NOW())`,
        [historyId, order.id, historyNote]
      )
    }

    return {
      success: true,
      orderId: payload.orderId,
      message: "Kargo bilgileri başarıyla güncellendi.",
    }
  })
}

/**
 * 3. BirFatura Fatura Bağlantısı Güncelleme (Idempotent & Transactional)
 * YALNIZCA store_order.display_id üzerinden eşleştirilir!
 */
export async function updateBirFaturaInvoiceLinkRecord(
  payload: BirFaturaInvoiceLinkUpdateRequest
): Promise<{ success: boolean; orderId: number; message: string; notificationId: string }> {
  await ensureCommerceSchema()

  return await withTransaction(async (client) => {
    // 1. Siparişi display_id ile bul
    const orderRes = await client.query(
      `SELECT id, display_id, invoice_number, invoice_status, email
       FROM store_order
       WHERE display_id = $1
       FOR UPDATE`,
      [payload.orderId]
    )

    if (!orderRes.rows.length) {
      throw new Error(`ORDER_NOT_FOUND`)
    }

    const order = orderRes.rows[0]
    const faturaUrl = payload.faturaUrl
    const faturaNo = payload.faturaNo || order.invoice_number || ""
    const faturaTarihi = payload.faturaTarihi || new Date().toISOString()

    const invoiceMetadata = JSON.stringify({
      provider: "birfatura",
      invoice_date: faturaTarihi,
      invoice_number: faturaNo,
      updated_via: "birfatura_callback",
    })

    // 2. store_invoice tablosuna güvenli güncelle / ekle (provider_id = 'birfatura', pdf_url = faturaUrl)
    const existingInvoice = await client.query(
      `SELECT id, invoice_number FROM store_invoice WHERE order_id = $1 LIMIT 1`,
      [order.id]
    )

    if (existingInvoice.rows.length) {
      await client.query(
        `UPDATE store_invoice
         SET pdf_url = $2,
             invoice_number = COALESCE(NULLIF($3, ''), invoice_number),
             status = 'issued',
             provider_id = 'birfatura',
             metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
             updated_at = NOW()
         WHERE order_id = $1`,
        [order.id, faturaUrl, faturaNo, invoiceMetadata]
      )
    } else {
      const invoiceId = `inv_bf_${order.id}`
      await client.query(
        `INSERT INTO store_invoice
           (id, order_id, invoice_type, invoice_number, status, provider_id, pdf_url, metadata, created_at, updated_at)
         VALUES ($1, $2, 'individual', $3, 'issued', 'birfatura', $4, $5::jsonb, NOW(), NOW())`,
        [invoiceId, order.id, faturaNo, faturaUrl, invoiceMetadata]
      )
    }

    // 3. store_order tablosundaki fatura numarasını ve durumunu güncelle
    await client.query(
      `UPDATE store_order
       SET invoice_number = COALESCE(NULLIF($2, ''), invoice_number),
           invoice_status = 'issued',
           updated_at = NOW()
       WHERE id = $1`,
      [order.id, faturaNo]
    )

    // Deterministic ID makes repeated BirFatura callbacks idempotent: the same
    // invoice can be retried, but the customer receives at most one email.
    const notificationId = `notif_invoice_${order.id}`
    await client.query(
      `INSERT INTO notification_outbox (id, type, recipient, subject, payload)
       VALUES ($1, 'invoice_issued', $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         payload = EXCLUDED.payload,
         subject = EXCLUDED.subject,
         updated_at = NOW()`,
      [
        notificationId,
        order.email,
        `Sipariş #${order.display_id} faturanız hazır`,
        {
          order_id: order.id,
          order_code: String(order.display_id),
          invoice_number: faturaNo,
          invoice_url: faturaUrl,
        },
      ]
    )

    return {
      success: true,
      orderId: payload.orderId,
      message: "Fatura linki başarıyla kaydedildi.",
      notificationId,
    }
  })
}
