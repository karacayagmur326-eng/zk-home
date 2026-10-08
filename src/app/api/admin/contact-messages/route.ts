import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { NextResponse } from "next/server"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getEmailBrandSettings } from "@lib/email/brand-settings"
import { processNotificationOutbox } from "@lib/notifications/outbox"
import { contactHistory } from "@lib/email/contact-history"
import { syncContactInbox } from "@lib/email/contact-inbox"
import { ensureQuestionConversations } from "@lib/contact/question-conversations"
import { randomUUID } from "crypto"

export const maxDuration = 60

export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    await ensureCommerceSchema()


    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    await ensureQuestionConversations()
    const kind = searchParams.get("kind") === "questions" ? "questions" : "messages"
    if (kind === "questions" && session.role === "Editör") return NextResponse.json({error:"Yetkisiz işlem."},{status:403})
    const channel = kind === "questions" ? "m.product_question_id IS NOT NULL" : "m.product_question_id IS NULL"
    let sql = `SELECT m.*,m.id::text,p.title AS product_title,p.handle AS product_handle FROM contact_messages m LEFT JOIN product_reviews q ON q.id=m.product_question_id LEFT JOIN store_product p ON p.id=q.product_id WHERE ${channel}`
    const params: any[] = []

    if (status) {
      sql += ` AND m.status = $1`
      params.push(status)
    }

    sql += ` ORDER BY GREATEST(m.created_at,m.replied_at,(SELECT MAX(created_at) FROM contact_incoming_replies r WHERE r.contact_id=m.id)) DESC`

    const messages = await query<any>(sql, params)
    for (const message of messages) message.history = await contactHistory(String(message.id))
    
    // Counts
    const counts = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM contact_messages m WHERE ${channel} GROUP BY status`
    )
    
    const countMap: Record<string, number> = {
      total: messages.length,
      new: 0,
      read: 0,
      replied: 0,
      archived: 0
    }
    
    let totalCount = 0
    for (const c of counts) {
      const num = parseInt(c.count, 10)
      countMap[c.status] = num
      totalCount += num
    }
    countMap.total = totalCount

    const totals = await query<{ messages: string; questions: string }>(`SELECT COUNT(*) FILTER (WHERE product_question_id IS NULL) AS messages,COUNT(*) FILTER (WHERE product_question_id IS NOT NULL) AS questions FROM contact_messages`)
    return NextResponse.json({ messages, counts: countMap, totals: totals[0] }, {headers:{"Cache-Control":"private, no-store"}})
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await request.json()
    const { id, status, reply } = body
    await ensureQuestionConversations()
    const [target] = await query<{product_question_id:string}>("SELECT product_question_id FROM contact_messages WHERE id=$1",[/^\d{1,18}$/.test(String(id || "")) ? id : null])
    if (target?.product_question_id && session.role === "Editör") return NextResponse.json({error:"Yetkisiz işlem."},{status:403})

    if (!/^\d{1,18}$/.test(String(id || "")) || (!status && !reply) || (status && !["new","read","replied","archived"].includes(status))) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 })
    }

    if (typeof reply === "string") {
      const cleanReply = reply.trim()
      if (cleanReply.length < 3 || cleanReply.length > 10000) {
        return NextResponse.json(
          { error: "Yanıt 3 ile 10.000 karakter arasında olmalıdır." },
          { status: 400 }
        )
      }
      await ensureCommerceSchema()
      const messages = await query<any>(
        `SELECT m.*,m.id::text,p.title AS product_title,p.handle AS product_handle FROM contact_messages m LEFT JOIN product_reviews q ON q.id=m.product_question_id LEFT JOIN store_product p ON p.id=q.product_id WHERE m.id=$1`,
        [id]
      )
      const message = messages[0]
      if (!message) {
        return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 })
      }

      const brand = await getEmailBrandSettings()
      const payload = {
        message_id: String(message.id),
        product_question_id: message.product_question_id ? String(message.product_question_id) : undefined,
        name: message.name,
        email: message.email,
        contact_subject: message.subject,
        order_no: message.order_no,
        message: message.message,
        reply: cleanReply,
      }
      const replyId = randomUUID()
      const customerId = `notif_contact_reply_customer_${message.id}_${replyId}`
      const notificationRows: Array<[string, string, string, string, any]> = [
        [
          customerId,
          "contact_reply_customer",
          message.email,
          `ZK HOME #${message.id} Talep — ${message.subject || "İletişim Talebi"}`,
          payload,
        ],
      ]
      for (const [index, adminEmail] of brand.adminEmails.entries()) {
        notificationRows.push([
          `notif_contact_reply_admin_${message.id}_${replyId}_${index}`,
          "contact_reply_admin",
          adminEmail,
          `[Yanıt Kopyası] ${message.subject || "İletişim Talebi"}`,
          { ...payload, reply_to: message.email },
        ])
      }
      await withTransaction(async db => {
        const locked = await db.query("SELECT * FROM contact_messages WHERE id=$1 FOR UPDATE", [id])
        if (!locked.rows[0]) throw new Error("Mesaj bulunamadı.")
        if (locked.rows[0].product_question_id && body.publish_answer === true) {
          await db.query("UPDATE product_reviews SET answer=$2,answered_at=NOW(),answer_version=COALESCE(answer_version,0)+1,status='approved' WHERE id=$1 AND type='question'",[locked.rows[0].product_question_id,cleanReply])
        }
        await db.query(`INSERT INTO notification_outbox (id,type,recipient,subject,payload,status,created_at)
          SELECT 'legacy_contact_reply_' || m.id, 'contact_reply_customer',m.email,m.subject,
            jsonb_build_object('message_id',m.id::text,'reply',m.admin_reply), 'unknown',COALESCE(m.replied_at,m.created_at)
          FROM contact_messages m WHERE m.id=$1 AND m.admin_reply IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM notification_outbox n WHERE n.type IN ('contact_reply_customer','product_question_answered') AND n.payload->>'message_id'=m.id::text)
          ON CONFLICT (id) DO NOTHING`, [id])
        for (const row of notificationRows) {
        await db.query(
          `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
           VALUES ($1,$2,$3,$4,$5)`,
          row
        )
        }
        await db.query("UPDATE contact_messages SET admin_reply=$1,replied_at=NOW(),status='replied' WHERE id=$2", [cleanReply,id])
      })
      const delivery = await processNotificationOutbox(
        notificationRows.length,
        notificationRows.map((row) => row[0])
      ).catch(() => null)
      const [customerDelivery] = await query<{ status: string }>("SELECT status FROM notification_outbox WHERE id=$1", [customerId])
      const [current] = await query<{ status: string }>("SELECT status FROM contact_messages WHERE id=$1", [id])
      message.status = current?.status || "replied"
      message.admin_reply = cleanReply
      message.history = await contactHistory(String(id))
      return NextResponse.json({
        ok: true,
        message,
        notifications: {
          queued: notificationRows.length,
          sent: delivery?.sent || 0,
          customer_sent: customerDelivery?.status === "sent",
        },
      })
    }

    await query(`UPDATE contact_messages SET status = $1 WHERE id = $2`, [status, id])

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    return NextResponse.json({ ok: true, ...await syncContactInbox() })
  } catch {
    return NextResponse.json({ error: "Posta kutusu okunamadı. IMAP erişimini ve gelen posta sunucusunu kontrol edin; SMTP bağlantısı tek başına gelen postayı doğrulamaz." }, { status: 502 })
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Eksik ID" }, { status: 400 })
    }

    await ensureQuestionConversations()
    await withTransaction(async db => {
      const locked = await db.query("SELECT product_question_id FROM contact_messages WHERE id=$1 FOR UPDATE",[id])
      if (locked.rows[0]?.product_question_id && session.role === "Editör") throw new Error("Yetkisiz işlem.")
      if (locked.rows[0]?.product_question_id) await db.query("DELETE FROM product_reviews WHERE id=$1 AND type='question'",[locked.rows[0].product_question_id])
      await db.query("DELETE FROM contact_messages WHERE id=$1",[id])
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
