import { query } from "@lib/admin/db"
import { NextResponse } from "next/server"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"
import { getCustomerSessionId } from "@lib/commerce/customer-auth"

let tableInitialized = false
const ensureTable = async () => {
  if (tableInitialized) return
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id BIGSERIAL PRIMARY KEY,
        product_id TEXT NOT NULL,
        author TEXT NOT NULL,
        email TEXT NOT NULL,
        rating SMALLINT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'review',
        image_url TEXT,
        answer TEXT,
        status TEXT NOT NULL DEFAULT 'approved',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS customer_id TEXT;
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_id TEXT;
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'review';
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS answer TEXT;
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN NOT NULL DEFAULT FALSE;
    `)
    tableInitialized = true
  } catch (err) {
    console.error("[reviews:ensureTable] Error:", err)
  }
}

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
    ).catch(() => [])

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
       WHERE product_id = $1 AND type = 'question' AND status = 'approved'
       ORDER BY created_at DESC`,
      [productId],
    ).catch(() => [])

    return NextResponse.json({
      reviews,
      questions,
      questions_count: questions.length,
      reviews_count: reviews.length,
    })
  } catch (err) {
    console.error("[reviews:GET] Error:", err)
    return NextResponse.json({ reviews: [], questions: [], questions_count: 0, reviews_count: 0 })
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

    const rows = await query<{
      id: string
      author: string
      rating: number
      comment: string
      date: string
      image_url?: string
      type: string
    }>(
      `INSERT INTO product_reviews
         (product_id, author, email, rating, comment, type, image_url, status, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8)
       RETURNING id, author, rating, comment, image_url, type,
         TO_CHAR(created_at AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY') AS date`,
      [productId, author, email, rating, comment, type, imageUrl, customerId],
    )

    return NextResponse.json(
      {
        item: rows[0],
        message: type === "question" ? "Sorunuz başarıyla iletildi!" : "Değerlendirmeniz başarıyla yayınlandı!",
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
