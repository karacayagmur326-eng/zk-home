import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { isSafePublicImageUrl } from "@lib/security/public-assets"
import { persistInlineImageUrl } from "@lib/storage/persist-inline-image"
import { revalidatePath } from "next/cache"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const rows = await query<any>(
      `SELECT * FROM slider WHERE deleted_at IS NULL ORDER BY order_index ASC, created_at DESC`
    )
    const sliders = rows.map(({ image_url_light: legacyLightImage, ...slider }) => ({
      ...slider,
      image_url: legacyLightImage || slider.image_url || "",
    }))
    return NextResponse.json({ sliders })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await req.json()
    const {
      title,
      image_url,
      heading,
      subheading,
      description,
      badge_text,
      badge_color,
      bg_color,
      button_text,
      button_link,
      button_color,
      button2_text,
      button2_link,
      button2_color,
      text_color,
      features,
      right_features,
      top_bar_features,
      top_bar_color,
      is_active,
      order_index,
    } = body

    const persistedImageUrl = await persistInlineImageUrl(
      image_url,
      title || heading || "slider",
    ) as string

    if (persistedImageUrl && !isSafePublicImageUrl(persistedImageUrl)) {
      return NextResponse.json(
        { error: "Görsel önce medya kütüphanesine yüklenmelidir." },
        { status: 400 }
      )
    }

    const id = `slider_${Date.now()}`
    const now = new Date().toISOString()

    const [slider] = await query(
      `INSERT INTO slider (
        id, title, image_url, heading, subheading, description, badge_text, badge_color, 
        bg_color, button_text, button_link, button_color, button2_text, button2_link, 
        button2_color, text_color, features, right_features, top_bar_features, top_bar_color, is_active, order_index, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $23) 
      RETURNING *`,
      [
        id,
        title || heading || "İsimsiz Slider",
        persistedImageUrl || "",
        heading || null,
        subheading || null,
        description || null,
        badge_text || null,
        badge_color || null,
        bg_color || null,
        button_text || null,
        button_link || null,
        button_color || null,
        button2_text || null,
        button2_link || null,
        button2_color || null,
        text_color || null,
        features || null,
        right_features || null,
        top_bar_features || null,
        top_bar_color || null,
        is_active ?? true,
        order_index || 0,
        now,
      ]
    )

    revalidatePath("/", "layout")
    return NextResponse.json({ slider })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
