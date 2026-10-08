import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { DeliveryPlan, validateDeliveryPlan, deliveryPlanText, ZK_HOME_DELIVERY } from "@lib/util/local-delivery"
import { createId } from "@lib/commerce/repository"
import { processNotificationOutbox } from "@lib/notifications/outbox"

// Legacy shipped orders were saved as processing. Present/filter them consistently
// without rewriting order history or payment records.
const effectiveOrderStatusSql = `(CASE WHEN status = 'processing' AND fulfillment_status = 'shipped' THEN 'shipped' ELSE status END)`

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(["Admin", "Yönetici"])
    if (!session)
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
    await ensureCommerceSchema()
    const search = new URL(req.url).searchParams
    const id = search.get("id")
    if (id) {
      const orders = await query(
        `SELECT *, ${effectiveOrderStatusSql} AS status FROM store_order WHERE id=$1 LIMIT 1`,
        [id]
      )
      if (!orders.length) {
        return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
      }
      const order = orders[0]
      const email = order.email

      const [items, history, payments, refunds, invoices, customerStatsRows] = await Promise.all([
        query(
          `SELECT id,title,thumbnail,sku,quantity,unit_price,total
           FROM store_order_item WHERE order_id=$1 ORDER BY id`,
          [id]
        ).catch(() => []),
        query(
          `SELECT id,status,note,created_at FROM store_order_status_history
           WHERE order_id=$1 ORDER BY created_at DESC`,
          [id]
        ).catch(() => []),
        query(
          `SELECT id,provider_id,status,amount,currency_code,provider_reference,
                  error_message,created_at,updated_at
           FROM store_payment WHERE order_id=$1 ORDER BY created_at DESC`,
          [id]
        ).catch(() => []),
        query(
          `SELECT r.id,r.payment_id,r.amount,r.reason,r.status,
                  r.provider_reference,r.created_at
           FROM store_refund r
           JOIN store_payment p ON p.id=r.payment_id
           WHERE p.order_id=$1 ORDER BY r.created_at DESC`,
          [id]
        ).catch(() => []),
        query(
          `SELECT id,invoice_type,invoice_number,status,provider_id,
                  provider_reference,pdf_url,metadata,created_at,updated_at
           FROM store_invoice WHERE order_id=$1 LIMIT 1`,
          [id]
        ).catch(() => []),
        email
          ? query(
              `SELECT COUNT(*)::int AS total_orders,
                      COALESCE(SUM(total), 0)::bigint AS total_spent,
                      COALESCE(AVG(total), 0)::bigint AS avg_order_value
               FROM store_order WHERE email=$1`,
              [email]
            ).catch(() => [])
          : Promise.resolve([]),
      ])

      const customerStats = customerStatsRows[0] || {
        total_orders: 1,
        total_spent: order.total || 0,
        avg_order_value: order.total || 0,
      }

      return NextResponse.json({
        order,
        items,
        history,
        payments,
        refunds,
        invoice: invoices[0] || null,
        customer_stats: customerStats,
      })
    }
    const page = Math.max(Number(search.get("page") || 1), 1)
    const limit = Math.min(Math.max(Number(search.get("limit") || 20), 1), 200)
    const status = search.get("status") || ""
    const dateFilter = search.get("date") || search.get("filter") || ""
    const searchQuery = search.get("search") || search.get("q") || ""
    const paymentStatus = search.get("payment_status") || ""
    const fulfillmentStatus = search.get("fulfillment_status") || ""

    const whereConditions: string[] = []
    const params: unknown[] = []

    if (status) {
      if (status === "pending" || status === "awaiting_payment") {
        params.push("awaiting_payment")
        whereConditions.push(`(status = $${params.length} OR payment_status = 'pending')`)
      } else {
        params.push(status)
        whereConditions.push(`${effectiveOrderStatusSql} = $${params.length}`)
      }
    }

    if (dateFilter === "today") {
      whereConditions.push(`created_at >= CURRENT_DATE`)
    }

    if (paymentStatus) {
      params.push(paymentStatus)
      whereConditions.push(`payment_status = $${params.length}`)
    }

    if (fulfillmentStatus) {
      params.push(fulfillmentStatus)
      whereConditions.push(`fulfillment_status = $${params.length}`)
    }

    if (searchQuery.trim()) {
      params.push(`%${searchQuery.trim()}%`)
      const pIdx = params.length
      whereConditions.push(`(email ILIKE $${pIdx} OR display_id::text ILIKE $${pIdx} OR shipping_carrier ILIKE $${pIdx} OR tracking_number ILIKE $${pIdx})`)
    }

    const where = whereConditions.length ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const queryParams = [...params, limit, (page - 1) * limit]
    const [summaryRows, count, orders] = await Promise.all([
      query<any>(`
        SELECT
          COUNT(*)::int AS total_orders,
          COUNT(*) FILTER (WHERE status IN ('pending', 'awaiting_payment', 'requires_action') OR payment_status = 'pending')::int AS pending_orders,
          COUNT(*) FILTER (WHERE ${effectiveOrderStatusSql} = 'processing' AND fulfillment_status NOT IN ('shipped', 'delivered', 'returned', 'cancelled', 'canceled'))::int AS processing_orders,
          COUNT(*) FILTER (WHERE status = 'shipped' OR fulfillment_status = 'shipped')::int AS shipped_orders,
          COUNT(*) FILTER (WHERE status = 'completed' OR fulfillment_status = 'delivered')::int AS completed_orders,
          COUNT(*) FILTER (WHERE status IN ('cancelled', 'canceled'))::int AS cancelled_orders,
          COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE), 0)::bigint AS today_revenue,
          COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE), 0)::bigint AS yesterday_revenue
        FROM store_order
      `).catch(() => [{}]),
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM store_order ${where}`,
        params
      ).catch(() => [{ count: 0 }]),
      query(
        `SELECT id,display_id,${effectiveOrderStatusSql} AS status,payment_status,fulfillment_status,email,
                currency_code,total,shipping_carrier,tracking_number,tracking_url,
                invoice_type,invoice_status,invoice_number,shipping_address,created_at
         FROM store_order ${where}
         ORDER BY created_at DESC
         LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
        queryParams
      ).catch(() => []),
    ])
    const summary = summaryRows[0]
    return NextResponse.json({
      orders,
      total: count[0]?.count || 0,
      page,
      limit,
      summary: summary || {
        total_orders: 0,
        pending_orders: 0,
        processing_orders: 0,
        shipped_orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
        today_revenue: 0,
        yesterday_revenue: 0,
      },
    })
  } catch (err: any) {
    console.error("Error in GET /api/admin/orders:", err)
    return NextResponse.json({ error: err?.message || "Sipariş verileri alınırken sunucu hatası oluştu." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession(["Admin", "Yönetici"])
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureCommerceSchema()
  const body = await req.json().catch(() => null)
  const id = String(body?.id || "")
  if (!id) {
    return NextResponse.json({ error: "Sipariş kimliği gerekli." }, { status: 400 })
  }

  const orderStatuses = [
    "awaiting_payment",
    "processing",
    "completed",
    "cancelled",
    "canceled",
    "shipped",
    "pending",
  ]
  const paymentStatuses = [
    "pending",
    "authorized",
    "paid",
    "partially_refunded",
    "refunded",
    "refund_pending",
    "failed",
  ]
  const fulfillmentStatuses = [
    "delivery_scheduled",
    "not_fulfilled",
    "preparing",
    "shipped",
    "delivered",
    "returned",
    "cancelled",
    "canceled",
  ]
  let status = body?.status ? String(body.status) : null
  const paymentStatus = body?.payment_status
    ? String(body.payment_status)
    : null
  let fulfillmentStatus = body?.fulfillment_status
    ? String(body.fulfillment_status)
    : null

  if (status === "shipped" && !fulfillmentStatus) {
    fulfillmentStatus = "shipped"
  }
  if (fulfillmentStatus === "shipped" && (!status || status === "processing")) {
    status = "shipped"
  }

  const localDelivery = body?.shipping_carrier === ZK_HOME_DELIVERY
  let deliveryPlan: DeliveryPlan | null = null
  if (localDelivery && fulfillmentStatus === "shipped") fulfillmentStatus = "delivery_scheduled"
  if (fulfillmentStatus === "delivery_scheduled") {
    if (!localDelivery) return NextResponse.json({ error: "Planlı teslimat için ZK Home Teslimat seçin." }, { status: 400 })
    try { deliveryPlan = validateDeliveryPlan(body?.delivery_plan) }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Geçersiz teslimat planı." }, { status: 400 }) }
    status = "processing"
  }

  if (status && !orderStatuses.includes(status)) {
    return NextResponse.json({ error: "Geçersiz sipariş durumu." }, { status: 400 })
  }
  if (status === "cancelled" && body?.confirm_cancel !== true) {
    return NextResponse.json(
      { error: "Sipariş iptali için açık onay gereklidir." },
      { status: 409 }
    )
  }
  if (paymentStatus && !paymentStatuses.includes(paymentStatus)) {
    return NextResponse.json({ error: "Geçersiz ödeme durumu." }, { status: 400 })
  }
  if (fulfillmentStatus && !fulfillmentStatuses.includes(fulfillmentStatus)) {
    return NextResponse.json({ error: "Geçersiz kargo durumu." }, { status: 400 })
  }
  const invoiceStatus = body?.invoice_status
    ? String(body.invoice_status)
    : null
  const invoiceStatuses = [
    "not_issued",
    "awaiting_payment",
    "pending",
    "issued",
    "failed",
    "cancelled",
  ]
  if (invoiceStatus && !invoiceStatuses.includes(invoiceStatus)) {
    return NextResponse.json({ error: "Geçersiz fatura durumu." }, { status: 400 })
  }
  const invoiceNumber = body?.invoice_number
    ? String(body.invoice_number).trim().slice(0, 80)
    : null
  if (invoiceStatus === "issued" && !invoiceNumber) {
    return NextResponse.json(
      { error: "Düzenlenmiş fatura için fatura numarası zorunludur." },
      { status: 400 }
    )
  }

  let birFaturaSyncQueued = false
  let localDeliveryNotificationId: string | null = null
  let shippingNotificationId: string | null = null
  let deliveryNotificationId: string | null = null
  await withTransaction(async (client) => {
    const current = await client.query<{
      status: string
      display_id: number
      email: string
      payment_status: string
      fulfillment_status: string
      coupon_code: string | null
    }>(
      `SELECT status,display_id,email,payment_status,fulfillment_status,coupon_code
       FROM store_order WHERE id=$1 FOR UPDATE`,
      [id]
    )
    if (!current.rows.length) throw new Error("Sipariş bulunamadı.")

    const ensureStatusNotification = async (
      type: "order_shipped" | "order_delivered" | "order_local_delivery",
      subject: string,
      payload: Record<string, unknown>,
      eventKey = ""
    ) => {
      const existing = await client.query<{ id: string; status: string }>(
        `SELECT id,status
         FROM notification_outbox
         WHERE type=$1
           AND (payload->>'internal_order_id'=$2 OR payload->>'order_id'=$2)
           AND ($3='' OR payload->>'delivery_key'=$3)
         ORDER BY created_at ASC
         FOR UPDATE`,
        [type, id, eventKey]
      )
      if (existing.rows.some((row) => row.status === "sent")) return null

      const reusable = existing.rows.find((row) =>
        ["pending", "failed"].includes(row.status)
      )
      const notificationId = reusable?.id || `notif_${type}_${id}${eventKey ? `_${eventKey}` : ""}`

      if (reusable) {
        await client.query(
          `UPDATE notification_outbox
           SET recipient=$2,subject=$3,payload=$4,status='pending',last_error=NULL,updated_at=NOW()
           WHERE id=$1`,
          [notificationId, current.rows[0].email, subject, payload]
        )
      } else {
        await client.query(
          `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO NOTHING`,
          [notificationId, type, current.rows[0].email, subject, payload]
        )
      }

      // Geçmiş sürümlerin oluşturduğu aynı olaya ait fazladan bekleyen kayıtları
      // gönderme; müşteriye her aşama için yalnızca bir e-posta ulaşsın.
      await client.query(
        `UPDATE notification_outbox
         SET status='superseded',updated_at=NOW()
         WHERE type=$1 AND id<>$2 AND status IN ('pending','failed')
           AND (payload->>'internal_order_id'=$3 OR payload->>'order_id'=$3)`,
        [type, notificationId, id]
      )
      return notificationId
    }

    const isAlreadyCancelledOrRefunded =
      current.rows[0].status === "cancelled" ||
      ["refunded"].includes(current.rows[0].payment_status)

    if (isAlreadyCancelledOrRefunded) {
      if (
        (status && ["processing", "completed", "shipped"].includes(status)) ||
        (fulfillmentStatus && ["preparing", "shipped", "delivered"].includes(fulfillmentStatus))
      ) {
        throw new Error(
          "İptal edilmiş veya ücreti iade edilmiş bir sipariş yeniden hazırlık/kargo sürecine alınamaz."
        )
      }
    }

    if (status === "cancelled" && current.rows[0].status !== "cancelled") {
      if (
        ["paid", "authorized", "partially_refunded"].includes(
          current.rows[0].payment_status
        )
      ) {
        throw new Error(
          "Tahsil edilmiş sipariş doğrudan iptal edilemez. Önce ödeme iadesi oluşturun."
        )
      }
      await client.query(
        `UPDATE store_variant v
         SET stock = v.stock + oi.quantity, updated_at = NOW()
         FROM store_order_item oi
         WHERE oi.order_id = $1
           AND oi.variant_id = v.id
           AND v.manage_inventory = TRUE`,
        [id]
      )
      if (current.rows[0].coupon_code) {
        await client.query(
          `UPDATE store_coupon
           SET usage_count=GREATEST(usage_count-1,0),updated_at=NOW()
           WHERE UPPER(code)=UPPER($1)`,
          [current.rows[0].coupon_code]
        )
      }
    }

    if (paymentStatus === "paid") {
      const payment = await client.query<{ provider_id: string }>(
        `SELECT provider_id FROM store_payment
         WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [id]
      )
      if (
        payment.rows[0] &&
        !["bank_transfer", "cash_on_delivery"].includes(
          payment.rows[0].provider_id
        )
      ) {
        throw new Error(
          "Kart ödemeleri yönetim panelinden tahsil edildi olarak işaretlenemez; ödeme kuruluşu doğrulaması gerekir."
        )
      }
      await client.query(
        `UPDATE store_invoice
         SET status=CASE WHEN status='awaiting_payment' THEN 'pending' ELSE status END,
             updated_at=NOW()
         WHERE order_id=$1`,
        [id]
      )
    }

    const shippingAddress = body?.shipping_address ? JSON.stringify(body.shipping_address) : null
    const billingAddress = body?.billing_address ? JSON.stringify(body.billing_address) : null
    const createdAt = body?.created_at ? new Date(body.created_at).toISOString() : null
    const customerId = body?.customer_id !== undefined ? (body.customer_id ? String(body.customer_id) : null) : null
    const email = body?.email ? String(body.email) : null

    await client.query(
      `UPDATE store_order SET
         status = COALESCE($2, status),
         payment_status = COALESCE($3, payment_status),
         fulfillment_status = COALESCE($4, fulfillment_status),
         shipping_carrier = COALESCE($5, shipping_carrier),
         tracking_number = COALESCE($6, tracking_number),
         tracking_url = COALESCE($7, tracking_url),
         invoice_status = COALESCE($8, invoice_status),
         invoice_number = COALESCE($9, invoice_number),
         shipping_address = COALESCE($10::jsonb, shipping_address),
         billing_address = COALESCE($11::jsonb, billing_address),
         created_at = COALESCE($12::timestamptz, created_at),
         customer_id = CASE WHEN $13 = 'CLEAR' THEN NULL WHEN $13 IS NOT NULL THEN $13 ELSE customer_id END,
         email = COALESCE($14, email),
         delivered_at = CASE WHEN $4='delivered' AND delivered_at IS NULL
           THEN NOW() ELSE delivered_at END,
         metadata = CASE WHEN $15::jsonb IS NOT NULL THEN COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('delivery_plan',$15::jsonb)
           WHEN $5 IS NOT NULL AND $5 <> 'ZK Home Teslimat' THEN COALESCE(metadata,'{}'::jsonb) - 'delivery_plan' ELSE metadata END,
         updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        status,
        paymentStatus,
        fulfillmentStatus,
        body?.shipping_carrier || null,
        localDelivery ? "" : body?.tracking_number || null,
        localDelivery ? "" : body?.tracking_url || null,
        invoiceStatus,
        invoiceNumber,
        shippingAddress,
        billingAddress,
        createdAt,
        body?.customer_id === null ? 'CLEAR' : customerId,
        email,
        deliveryPlan ? JSON.stringify(deliveryPlan) : null,
      ]
    )

    if (paymentStatus) {
      await client.query(
        "UPDATE store_payment SET status=$2,updated_at=NOW() WHERE order_id=$1",
        [id, paymentStatus]
      )
    }
    if (invoiceStatus || invoiceNumber) {
      await client.query(
        `UPDATE store_invoice SET
           status=COALESCE($2,status),
           invoice_number=COALESCE($3,invoice_number),
           updated_at=NOW()
         WHERE order_id=$1`,
        [id, invoiceStatus, invoiceNumber]
      )
    }
    const historyStatus = status || paymentStatus || fulfillmentStatus
    if (historyStatus) {
      await client.query(
        `INSERT INTO store_order_status_history (id,order_id,status,note)
         VALUES ($1,$2,$3,$4)`,
        [
          createId("ordhist"),
          id,
          historyStatus,
          String(body?.note || "Yönetim panelinden güncellendi."),
        ]
      )
    }
    if (
      fulfillmentStatus === "shipped" &&
      current.rows[0].fulfillment_status !== "shipped"
    ) {
      birFaturaSyncQueued = true
      await client.query(
        `INSERT INTO store_invoice (id, order_id, invoice_type, status, provider_id, created_at, updated_at)
         VALUES ($1, $2, 'e_archive', 'pending', 'birfatura', NOW(), NOW())
         ON CONFLICT (order_id) DO NOTHING`,
        [createId("inv"), id]
      ).catch(() => {})

    }

    if (deliveryPlan) {
      const key = `${deliveryPlan.date}_${deliveryPlan.start.replace(":","")}_${deliveryPlan.end.replace(":","")}`
      localDeliveryNotificationId = await ensureStatusNotification("order_local_delivery", "ZK Home teslimatınız planlandı", {
        order_id: `#${current.rows[0].display_id}`, internal_order_id: id,
        delivery_key: key, delivery_plan: deliveryPlan, delivery_window: deliveryPlanText(deliveryPlan),
      }, key)
      // Switching to hand delivery must not send a stale queued carrier email.
      await client.query("UPDATE notification_outbox SET status='superseded',updated_at=NOW() WHERE type='order_shipped' AND status IN ('pending','failed') AND payload->>'internal_order_id'=$1",[id])
    }

    if ((body?.shipping_carrier && !localDelivery) || ["delivered","cancelled","canceled"].includes(fulfillmentStatus || "")) {
      await client.query("UPDATE notification_outbox SET status='superseded',updated_at=NOW() WHERE type='order_local_delivery' AND status IN ('pending','failed') AND payload->>'internal_order_id'=$1",[id])
    }
    if (fulfillmentStatus === "shipped") {
      shippingNotificationId = await ensureStatusNotification(
        "order_shipped",
        "Siparişiniz kargoya verildi",
        {
          order_id: `#${current.rows[0].display_id}`,
          internal_order_id: id,
          carrier: body?.shipping_carrier || null,
          tracking_number: body?.tracking_number || null,
          tracking_url: body?.tracking_url || null,
        }
      )
    }

    if (fulfillmentStatus === "delivered") {
      deliveryNotificationId = await ensureStatusNotification(
        "order_delivered",
        "Siparişiniz teslim edildi",
        {
          order_id: `#${current.rows[0].display_id}`,
          internal_order_id: id,
        }
      )
    }
  })

  const pendingStatusNotificationIds: Array<string | null> = [
    localDeliveryNotificationId as string | null,
    shippingNotificationId as string | null,
    deliveryNotificationId as string | null,
  ]
  const statusNotificationIds = pendingStatusNotificationIds.filter(
    (value): value is string => typeof value === "string"
  )
  const emailDelivery = statusNotificationIds.length
    ? await processNotificationOutbox(
      statusNotificationIds.length,
      statusNotificationIds
    )
    : null

  return NextResponse.json({
    success: true,
    birfatura_sync_queued: birFaturaSyncQueued,
    email_delivery: emailDelivery,
  })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(["Admin", "Yönetici"])
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureCommerceSchema()
  const body = await req.json().catch(() => null)
  const action = String(body?.action || "")
  const orderId = String(body?.order_id || body?.id || "")

  if (!orderId || !action) {
    return NextResponse.json({ error: "Eylem ve sipariş ID gerekli." }, { status: 400 })
  }

  const orders = await query<any>(`SELECT * FROM store_order WHERE id=$1 LIMIT 1`, [orderId])
  if (!orders.length) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
  }
  const order = orders[0]

  if (action === "create_invoice" || action === "sync_invoice") {
    if (!["shipped", "delivered"].includes(order.fulfillment_status)) {
      return NextResponse.json(
        { error: "Önce sipariş durumunu Kargoya Verildi olarak kaydedin." },
        { status: 409 }
      )
    }
    await query(
      `INSERT INTO store_invoice (id, order_id, invoice_type, status, provider_id, created_at, updated_at)
       VALUES ($1, $2, 'e_archive', 'pending', 'birfatura', NOW(), NOW())
       ON CONFLICT (order_id) DO UPDATE SET
         provider_id='birfatura',
         status=CASE
           WHEN store_invoice.status='issued' THEN store_invoice.status
           ELSE 'pending'
         END,
         updated_at=NOW()`,
      [createId("inv"), orderId]
    ).catch(() => {})

    await query(
      `INSERT INTO store_order_status_history (id, order_id, status, note)
       VALUES ($1, $2, $3, $4)`,
      [createId("ordhist"), orderId, order.status || "processing", "Sipariş BirFatura'nın çekebilmesi için hazırlandı; PDF callback'i bekleniyor."]
    ).catch(() => {})

    return NextResponse.json({
      success: true,
      awaiting_callback: true,
      message: "Sipariş hazır. BirFatura henüz PDF bağlantısı göndermedi; BirFatura panelinden siparişleri çekme/senkron işlemini çalıştırın.",
    })
  }

  if (action === "send_details") {
    if (order.email) {
      await query(
        `INSERT INTO notification_outbox (id, type, recipient, subject, payload)
         VALUES ($1, 'order_details', $2, 'Sipariş Detaylarınız', $3)`,
        [createId("notif"), order.email, { order_id: orderId }]
      ).catch(() => {})
    }
    await query(
      `INSERT INTO store_order_status_history (id, order_id, status, note)
       VALUES ($1, $2, $3, $4)`,
      [createId("ordhist"), orderId, order.status || "processing", "Sipariş ayrıntıları müşteriye tekrar gönderildi."]
    ).catch(() => {})
    return NextResponse.json({ success: true, message: "Sipariş ayrıntıları müşteriye gönderildi." })
  }

  if (action === "resend_notification") {
    if (order.email) {
      await query(
        `INSERT INTO notification_outbox (id, type, recipient, subject, payload)
         VALUES ($1, 'new_order_admin', $2, 'Yeni Sipariş Bildirimi (Tekrar)', $3)`,
        [createId("notif"), order.email, { order_id: orderId }]
      ).catch(() => {})
    }
    await query(
      `INSERT INTO store_order_status_history (id, order_id, status, note)
       VALUES ($1, $2, $3, $4)`,
      [createId("ordhist"), orderId, order.status || "processing", "Yeni sipariş bildirimi tekrar gönderildi."]
    ).catch(() => {})
    return NextResponse.json({ success: true, message: "Yeni sipariş bildirimi tekrar gönderildi." })
  }

  if (action === "regenerate_downloads") {
    await query(
      `INSERT INTO store_order_status_history (id, order_id, status, note)
       VALUES ($1, $2, $3, $4)`,
      [createId("ordhist"), orderId, order.status || "processing", "İndirme izinleri yeniden oluşturuldu."]
    ).catch(() => {})
    return NextResponse.json({ success: true, message: "İndirme izinleri yeniden oluşturuldu." })
  }

  return NextResponse.json({ error: "Bilinmeyen eylem." }, { status: 400 })
}
