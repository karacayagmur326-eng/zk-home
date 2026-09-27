import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId, slugify } from "@lib/commerce/repository"

export async function GET() {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const tags = await query<any>(
    `SELECT DISTINCT ON (value) *
     FROM store_tag
     ORDER BY value, created_at, id`
  )
  return NextResponse.json({ tags, count: tags.length })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
    }

    await ensureCommerceSchema()
    const body = await req.json()
    const values = Array.from(
      new Set(
        String(body.value || "")
          .split(/[,;\r\n]+/)
          .map((value) => slugify(value))
          .filter(Boolean)
      )
    )
    if (!values.length) {
      return NextResponse.json(
        { error: "Etiket değeri boş olamaz." },
        { status: 400 }
      )
    }

    const existingTags = await query<any>(
      `SELECT * FROM store_tag WHERE value = ANY($1::text[])`,
      [values]
    )
    const existingValues = new Set(existingTags.map((tag) => tag.value))
    const missingValues = values.filter((value) => !existingValues.has(value))

    if (missingValues.length) {
      const ids = missingValues.map(() => createId("ptag"))
      await query<any>(
        `INSERT INTO store_tag (id, value)
       SELECT input.id, input.value
       FROM UNNEST($1::text[], $2::text[]) AS input(id, value)
       WHERE NOT EXISTS (
         SELECT 1 FROM store_tag existing WHERE existing.value = input.value
       )`,
        [ids, missingValues]
      )
    }

    const matchingTags = await query<any>(
      `SELECT * FROM store_tag WHERE value = ANY($1::text[])`,
      [values]
    )
    // Eski veritabanlarında unique constraint bulunmayabilir ve geçmişten
    // aynı değerde kayıtlar kalmış olabilir. Ürüne her değer için tek kayıt dön.
    const tagByValue = new Map<string, any>()
    matchingTags.forEach((tag) => {
      if (!tagByValue.has(tag.value)) tagByValue.set(tag.value, tag)
    })
    const tags = values.map((value) => tagByValue.get(value)).filter(Boolean)
    if (tags.length !== values.length) {
      throw new Error("Etiketlerin bir bölümü oluşturulamadı. Lütfen tekrar deneyin.")
    }

    return NextResponse.json({
      success: true,
      tags,
      product_tag: tags[0],
      createdCount: missingValues.length,
      existingCount: values.length - missingValues.length,
    })
  } catch (error: any) {
    console.error("Etiket ekleme hatası:", error)
    return NextResponse.json(
      { error: error?.message || "Etiketler eklenemedi." },
      { status: 500 }
    )
  }
}
