import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { ensureContactHistory } from "@lib/email/contact-history"
import { processNotificationOutbox } from "@lib/notifications/outbox"

export const maxDuration = 60
export async function POST(request: Request) {
  if (!await getAdminSession(["Admin", "Yönetici"])) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const body = await request.json().catch(() => null)
  const message = typeof body?.message === "string" ? body.message.trim() : ""
  const subject = typeof body?.subject === "string" ? body.subject.trim() : ""
  const key = typeof body?.requestId === "string" ? body.requestId : ""
  if (message.length < 3 || message.length > 10000 || !subject || subject.length > 180 || !/^[a-f0-9-]{36}$/i.test(key)) return NextResponse.json({ error: "Konu ve 3–10.000 karakter arasında mesaj girin." }, { status: 400 })
  const orderId = typeof body?.orderId === "string" ? body.orderId : null
  const customerId = typeof body?.customerId === "string" ? body.customerId : null
  if (Boolean(orderId) === Boolean(customerId)) return NextResponse.json({ error: "Bir müşteri veya sipariş seçin." }, { status: 400 })
  try {
    await ensureCommerceSchema()
    await ensureContactHistory()
    // Recipient and conversation ownership come from the database, never form input.
    const [recipient] = orderId ? await query<{ customer_id: string | null; email: string; name: string; phone: string; order_no: string }>(`SELECT customer_id,email,CONCAT_WS(' ',shipping_address->>'first_name',shipping_address->>'last_name') AS name,shipping_address->>'phone' AS phone,display_id::text AS order_no FROM store_order WHERE id=$1`, [orderId]) : await query<{ customer_id: string; email: string; name: string; phone: string; order_no: null }>(`SELECT id AS customer_id,email,CONCAT_WS(' ',first_name,last_name) AS name,phone,NULL AS order_no FROM store_customer WHERE id=$1`, [customerId])
    if (!recipient?.email) return NextResponse.json({ error: "Müşteri veya e-posta adresi bulunamadı." }, { status: 404 })
    const notificationId = `notif_admin_message_${key}`
    const id = await withTransaction(async db => {
      const result = await db.query<{ id: string }>(`INSERT INTO contact_messages (name,email,phone,subject,order_no,message,status,customer_id,admin_reply,replied_at,initiated_by_admin,admin_message_key)
        VALUES ($1,$2,$3,$4,$5,$6,'replied',$7,$6,NOW(),TRUE,$8)
        ON CONFLICT (admin_message_key) WHERE admin_message_key IS NOT NULL DO NOTHING RETURNING id::text`, [recipient.name || "Değerli Müşterimiz",recipient.email,recipient.phone,subject,recipient.order_no,message,recipient.customer_id,key])
      let contactId = result.rows[0]?.id
      if (!contactId) {
        const previous = await db.query<{ id: string; email: string; subject: string; message: string; customer_id: string | null; order_no: string | null }>("SELECT id::text,email,subject,message,customer_id,order_no FROM contact_messages WHERE admin_message_key=$1", [key])
        const old = previous.rows[0]
        if (!old || old.email !== recipient.email || old.customer_id !== recipient.customer_id || old.order_no !== recipient.order_no || old.subject !== subject || old.message !== message) throw new Error("Gönderim anahtarı farklı bir mesaj için kullanılmış. Mesaj penceresini yeniden açın.")
        contactId = old.id
      }
      await db.query(`INSERT INTO notification_outbox (id,type,recipient,subject,payload) VALUES ($1,'contact_reply_customer',$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [notificationId,recipient.email,`Mağaza #${contactId} Talep — ${subject}`, { message_id: contactId, name: recipient.name, email: recipient.email, contact_subject: subject, order_no: recipient.order_no, reply: message, initiated_by_admin: true }])
      return contactId
    }, { invalidateCatalog: false })
    await processNotificationOutbox(1,[notificationId]).catch(() => null)
    const [delivery] = await query<{ status: string }>("SELECT status FROM notification_outbox WHERE id=$1",[notificationId])
    return NextResponse.json({ ok: true, id, emailSent: delivery?.status === "sent" })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Mesaj gönderilemedi." }, { status: 500 }) }
}
