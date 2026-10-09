import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { isSafePublicImageUrl } from "@lib/security/public-assets"
import { persistInlineImageUrl } from "@lib/storage/persist-inline-image"
import { sliderRevealEnd } from "@lib/content/slider-reveal"
import { revalidatePath } from "next/cache"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  const { id } = await params
  try {
    await query("ALTER TABLE slider ADD COLUMN IF NOT EXISTS image_reveal_end INTEGER DEFAULT 65")
    await query("ALTER TABLE slider ADD COLUMN IF NOT EXISTS image_reveal_enabled BOOLEAN DEFAULT TRUE")
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
      image_reveal_end,
      image_reveal_enabled,
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

    const [slider] = await query(
      `UPDATE slider SET 
        title=$1, image_url=$2, image_url_light=NULL, heading=$3, subheading=$4, description=$5, badge_text=$6, 
        badge_color=$7, bg_color=$8, button_text=$9, button_link=$10, button_color=$11, 
        button2_text=$12, button2_link=$13, button2_color=$14, text_color=$15, 
        features=$16, right_features=$17, top_bar_features=$18, top_bar_color=$19, is_active=$20, order_index=$21, updated_at=NOW(), image_reveal_end=$23, image_reveal_enabled=COALESCE($24, image_reveal_enabled, TRUE)
       WHERE id=$22 RETURNING *`,
      [
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
        id,
        sliderRevealEnd(image_reveal_end),
        typeof image_reveal_enabled === "boolean" ? image_reveal_enabled : null,
      ]
    )

    revalidatePath("/", "layout")
    return NextResponse.json({ slider })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Yönetim arayüzündeki mevcut güncelleme formu POST yöntemini de kullanır.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  const { id } = await params
  try {
    await query("ALTER TABLE slider ADD COLUMN IF NOT EXISTS image_reveal_end INTEGER DEFAULT 65")
    await query("ALTER TABLE slider ADD COLUMN IF NOT EXISTS image_reveal_enabled BOOLEAN DEFAULT TRUE")
    await query(`UPDATE slider SET deleted_at=NOW() WHERE id=$1`, [id])
    revalidatePath("/", "layout")
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
