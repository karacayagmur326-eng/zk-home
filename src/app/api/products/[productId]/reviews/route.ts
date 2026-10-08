import { query, withTransaction } from "@lib/admin/db"
import { ensureContactHistory } from "@lib/email/contact-history"
import { ensureProductQuestions } from "@lib/commerce/product-questions"
import { processNotificationOutbox } from "@lib/notifications/outbox"
import { NextResponse } from "next/server"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"
import { getCustomerSessionId } from "@lib/commerce/customer-auth"

export const maxDuration = 60

const ensureTable = ensureProductQuestions

export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await context.params
    await ensureTable()

    const reviews = await query<{
      id: string
      author: string
      rating: number
      comment: string
      date: string
      image_url?: string
      type: string
    }>(
      `SELECT id, author, rating, comment, image_url, type,
              TO_CHAR(created_at AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY') AS date
       FROM product_reviews
       WHERE product_id = $1 AND (type = 'review' OR type IS NULL) AND status = 'approved'
       ORDER BY created_at DESC`,
      [productId],
    )

    const questions = await query<{
      id: string
      author: string
      comment: string
      answer?: string
      date: string
    }>(
      `SELECT id, author, comment, answer,
              TO_CHAR(created_at AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY') AS date
       FROM product_reviews
       WHERE product_id = $1 AND type = 'question' AND status = 'approved' AND NULLIF(BTRIM(answer), '') IS NOT NULL
       ORDER BY created_at DESC`,
      [productId],
    )

    return NextResponse.json({
      reviews,
      questions,
      questions_count: questions.length,
      reviews_count: reviews.length,
    })
  } catch (err) {
    console.error("[reviews:GET] Error:", err)
    return NextResponse.json({ error: "Değerlendirmeler yüklenemedi." }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await context.params
    await ensureTable()

    const body = await request.json().catch(() => null)
    const type = body?.type === "question" ? "question" : "review"
    const author = typeof body?.author === "string" ? body.author.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const comment = typeof body?.comment === "string" ? body.comment.trim() : ""
    const rating = Math.min(5, Math.max(1, Number(body?.rating || 5)))
    const imageUrl = typeof body?.image_url === "string" ? body.image_url.trim() : null

    // 1. Validation Checks
    if (author.length < 3) {
      return NextResponse.json(
        { error: "Ad Soyad en az 3 karakter olmalıdır." },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir e-posta adresi girin." },
        { status: 400 }
      )
    }

    if (comment.length < 10) {
      return NextResponse.json(
        { error: type === "question" ? "Soru metni en az 10 karakter olmalıdır." : "Yorum metni en az 10 karakter olmalıdır." },
        { status: 400 }
      )
    }

    let rateAllowed = true
    try {
      const rate = await checkRateLimit(
        `product-review:${requestIp(request)}`,
        10,
        10 * 60
      )
      rateAllowed = rate.allowed
    } catch {
      rateAllowed = true
    }

    if (!rateAllowed) {
      return NextResponse.json(
        { error: "Çok fazla gönderim yaptınız. Lütfen birkaç dakika sonra tekrar deneyin." },
        { status: 429 }
      )
    }

    const customerId = (await getCustomerSessionId().catch(() => null)) || null

    const [product] = await query<{ title: string; handle: string }>("SELECT title,handle FROM store_product WHERE id=$1", [productId])
    if (!product) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    if (author.length > 180 || email.length > 254 || comment.length > 10000) return NextResponse.json({ error: "Gönderdiğiniz bilgiler izin verilen uzunluğu aşıyor." }, { status: 400 })
    await ensureContactHistory()
    const item = await withTransaction(async db => {
      const result = await db.query(`INSERT INTO product_reviews
         (product_id, author, email, rating, comment, type, image_url, status, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $9, $8)
       RETURNING id, author, rating, comment, image_url, type,
         TO_CHAR(created_at AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY') AS date`,
        [productId, author, email, rating, comment, type, imageUrl, customerId, type === "question" ? "pending" : "approved"])
      const row = result.rows[0]
      if (type === "question") {
        const thread = await db.query(`INSERT INTO contact_messages (product_question_id,name,email,subject,message,customer_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,[row.id,author,email,product.title,comment,customerId])
        await db.query(`INSERT INTO notification_outbox (id,type,recipient,subject,payload) VALUES ($1,'contact_message_received',$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [`notif_product_question_${row.id}`,email,`Mağaza #${thread.rows[0].id} Talep — Ürün sorunuzu aldık`,{ product_question_id: String(row.id), contact_subject: product.title, message_id: String(thread.rows[0].id), name: author, product_title: product.title, product_handle: product.handle, message: comment }])
      } else {
        await db.query(`INSERT INTO contact_messages (product_review_id,source_kind,name,email,subject,message,customer_id)
          VALUES ($1,'reviews',$2,$3,$4,$5,$6)`, [row.id,author,email,product.title,comment,customerId])
      }
      return row
    })
    if (type === "question") await processNotificationOutbox(1,[`notif_product_question_${item.id}`]).catch(() => null)

    return NextResponse.json(
      {
        item,
        message: type === "question" ? "Sorunuz alındı. En kısa sürede yanıtlayacağız. Sorunuz yanıtlandığında yayınlanacaktır." : "Değerlendirmeniz başarıyla yayınlandı!",
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error("[reviews:POST] Error:", err)
    return NextResponse.json(
      { error: "Gönderilirken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    )
  }
}
