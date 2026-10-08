import { NextResponse } from "next/server"
import { query } from "@lib/admin/db"
import { getContactCustomer } from "@lib/contact/customer-messages"
import { ensureProductQuestions } from "@lib/commerce/product-questions"

const headers = { "Cache-Control": "private, no-store" }

export async function GET() {
  try {
    const customer = await getContactCustomer()
    if (!customer) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers })
    await ensureProductQuestions()
    const questions = await query(`SELECT r.id::text,r.comment,r.answer,r.created_at,r.answered_at,
      p.title AS product_title,p.handle AS product_handle,
      NULLIF(BTRIM(r.answer),'') IS NOT NULL AS answered
      FROM product_reviews r LEFT JOIN store_product p ON p.id=r.product_id
      WHERE r.type='question' AND (r.customer_id=$1
        OR (r.customer_id IS NULL AND $3::boolean AND LOWER(r.email)=$2))
      ORDER BY COALESCE(r.answered_at,r.created_at) DESC,r.id DESC`,
      [customer.id, customer.email.toLowerCase(), customer.email_verified === true])
    return NextResponse.json({ questions }, { headers })
  } catch {
    return NextResponse.json({ error: "Sorularınız yüklenemedi. Lütfen tekrar deneyin." }, { status: 500, headers })
  }
}
