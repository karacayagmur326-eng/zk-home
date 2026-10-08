import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureProductQuestions } from "@lib/commerce/product-questions"
import { processNotificationOutbox } from "@lib/notifications/outbox"

export const maxDuration = 60

export async function GET() {
  if (!(await getAdminSession(["Admin", "Yönetici"])))
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  try {
    await ensureProductQuestions()
    const questions =
      await query(`SELECT r.id::text,r.product_id,r.author,r.email,r.comment,r.answer,r.status,r.created_at,r.answered_at,p.title AS product_title,p.handle AS product_handle
      FROM product_reviews r LEFT JOIN store_product p ON p.id=r.product_id
      WHERE r.type='question' ORDER BY r.created_at DESC LIMIT 500`)
    return NextResponse.json(
      { questions },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return NextResponse.json(
      { error: "Ürün soruları yüklenemedi." },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  if (!(await getAdminSession(["Admin", "Yönetici"])))
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  const body = await request.json().catch(() => null)
  const id = String(body?.id || "")
  const answer = typeof body?.answer === "string" ? body.answer.trim() : ""
  if (!/^\d+$/.test(id) || answer.length < 3 || answer.length > 10000)
    return NextResponse.json(
      { error: "3–10.000 karakter arasında bir yanıt yazın." },
      { status: 400 }
    )
  try {
    await ensureProductQuestions()
    const notificationId = await withTransaction(async (db) => {
      const result = await db.query(
        `SELECT r.*,p.title AS product_title,p.handle AS product_handle FROM product_reviews r LEFT JOIN store_product p ON p.id=r.product_id WHERE r.id=$1 AND r.type='question' FOR UPDATE OF r`,
        [id]
      )
      const row = result.rows[0]
      if (!row) return null
      const version =
        Number(row.answer_version || 0) + (row.answer === answer ? 0 : 1)
      await db.query(
        "UPDATE product_reviews SET answer=$2,answer_version=$3,answered_at=NOW(),status='approved' WHERE id=$1",
        [id, answer, version]
      )
      const key = `notif_product_answer_${id}_${version}`
      await db.query(
        `INSERT INTO notification_outbox (id,type,recipient,subject,payload) VALUES ($1,'product_question_answered',$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [
          key,
          row.email,
          "ZK Home — Ürün sorunuz yanıtlandı",
          {
            name: row.author,
            product_title: row.product_title,
            product_handle: row.product_handle,
            message: row.comment,
            answer,
          },
        ]
      )
      return key
    })
    if (!notificationId)
      return NextResponse.json({ error: "Soru bulunamadı." }, { status: 404 })
    await processNotificationOutbox(1, [notificationId]).catch(() => null)
    const [delivery] = await query<{ status: string }>(
      "SELECT status FROM notification_outbox WHERE id=$1",
      [notificationId]
    )
    return NextResponse.json({
      ok: true,
      emailSent: delivery?.status === "sent",
    })
  } catch {
    return NextResponse.json(
      { error: "Yanıt kaydedilemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    )
  }
}
