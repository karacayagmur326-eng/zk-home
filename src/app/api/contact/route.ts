import { query } from "@lib/admin/db"
import { NextResponse } from "next/server"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getEmailBrandSettings } from "@lib/email/brand-settings"
import { processNotificationOutbox } from "@lib/notifications/outbox"
import { ensureContactHistory } from "@lib/email/contact-history"
import { getContactCustomer } from "@lib/contact/customer-messages"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    await ensureCommerceSchema()
    const rate = await checkRateLimit(
      `contact:${requestIp(request)}`,
      10,
      10 * 60
    ).catch(() => ({ allowed: true }))

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Çok fazla mesaj gönderdiniz. Lütfen daha sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": "600" } }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: "Geçersiz istek gövdesi." },
        { status: 400 }
      )
    }

    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : ""
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : ""
    const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 40) : ""
    const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 160) : "Genel İletişim"
    const orderNo = typeof body?.order_no === "string" ? body.order_no.trim().slice(0, 80) : ""
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 5000) : ""
    const source = body?.source === "gifts" ? "gifts" : "contact"

    if (name.length < 2 || !emailPattern.test(email) || message.length < 5) {
      return NextResponse.json(
        { error: "Lütfen tüm zorunlu alanları doğru şekilde doldurun." },
        { status: 400 },
      )
    }

    await ensureContactHistory()
    const customer = await getContactCustomer()
    const rows = await query<{ id: string }>(
      `INSERT INTO contact_messages (name, email, phone, subject, order_no, message, customer_id, source_kind)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [name, email, phone || null, subject, orderNo || null, message, customer?.id || null, source],
    )

    const messageId = String(rows[0]?.id || "")
    const brand = await getEmailBrandSettings()
    const notificationIds: string[] = []
    const payload = {
      message_id: messageId,
      name,
      email,
      phone,
      contact_subject: subject,
      order_no: orderNo,
      message,
    }

    for (const [index, adminEmail] of brand.adminEmails.entries()) {
      const adminNotificationId = `notif_contact_admin_${messageId}_${index}`
      await query(
        `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
         VALUES ($1,'contact_message_admin',$2,$3,$4)
         ON CONFLICT (id) DO NOTHING`,
        [
          adminNotificationId,
          adminEmail,
          `[Yeni İletişim Talebi] ${subject} — ${name}`,
          { ...payload, reply_to: email },
        ]
      )
      notificationIds.push(adminNotificationId)
    }

    const customerNotificationId = `notif_contact_customer_${messageId}`
    await query(
      `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
       VALUES ($1,'contact_message_received',$2,$3,$4)
       ON CONFLICT (id) DO NOTHING`,
      [
        customerNotificationId,
        email,
        `${brand.brandName} mesajınızı aldı`,
        payload,
      ]
    )
    notificationIds.push(customerNotificationId)

    const delivery = await processNotificationOutbox(
      notificationIds.length,
      notificationIds
    ).catch(() => null)

    return NextResponse.json(
      {
        ok: true,
        id: messageId,
        notifications: {
          queued: notificationIds.length,
          sent: delivery?.sent || 0,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Contact API error:", error)
    return NextResponse.json(
      { error: "Mesaj kaydedilirken sunucu hatası oluştu." },
      { status: 500 }
    )
  }
}
