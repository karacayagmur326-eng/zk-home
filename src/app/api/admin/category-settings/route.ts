import { query } from "@lib/admin/db"
import { getAdminSession } from "@lib/admin/auth"
import { NextResponse } from "next/server"

const ensureTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS category_settings (
      id TEXT PRIMARY KEY DEFAULT 'main',
      icon_size TEXT NOT NULL DEFAULT '24',
      font_size TEXT NOT NULL DEFAULT '12',
      font_weight TEXT NOT NULL DEFAULT '700',
      icon_color TEXT NOT NULL DEFAULT '#C98484',
      text_color TEXT NOT NULL DEFAULT '#1e293b',
      icon_bg TEXT NOT NULL DEFAULT '#fcf7f6',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await query(`ALTER TABLE category_settings ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT '12';`)
  await query(`ALTER TABLE category_settings ADD COLUMN IF NOT EXISTS font_weight TEXT DEFAULT '700';`)
  await query(`ALTER TABLE category_settings ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#C98484';`)
  await query(`ALTER TABLE category_settings ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1e293b';`)
  await query(`ALTER TABLE category_settings ADD COLUMN IF NOT EXISTS icon_bg TEXT DEFAULT '#fcf7f6';`)

  await query(`
    INSERT INTO category_settings (id, icon_size, font_size, font_weight, icon_color, text_color, icon_bg)
    VALUES ('main', '24', '12', '700', '#C98484', '#1e293b', '#fcf7f6')
    ON CONFLICT (id) DO NOTHING
  `)
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()
  const rows = await query<{
    icon_size: string
    font_size: string
    font_weight: string
    icon_color: string
    text_color: string
    icon_bg: string
  }>(
    `SELECT icon_size, font_size, font_weight, icon_color, text_color, icon_bg FROM category_settings WHERE id = 'main'`
  )

  let iconVal = rows[0]?.icon_size || '24'
  if (iconVal === 'sm') iconVal = '16'
  if (iconVal === 'md') iconVal = '24'
  if (iconVal === 'lg') iconVal = '32'
  if (iconVal === 'xl') iconVal = '40'

  return NextResponse.json({
    icon_size: iconVal,
    font_size: rows[0]?.font_size || '12',
    font_weight: rows[0]?.font_weight || '700',
    icon_color: rows[0]?.icon_color || '#C98484',
    text_color: rows[0]?.text_color || '#1e293b',
    icon_bg: rows[0]?.icon_bg || '#fcf7f6',
  })
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem. Yalnızca şifresiyle giriş yapmış admin değiştirebilir." }, { status: 401 })
  }

  await ensureTable()
  const body = await request.json().catch(() => null)

  let rawIcon = String(body?.icon_size || '24').trim()
  if (rawIcon === 'sm') rawIcon = '16'
  if (rawIcon === 'md') rawIcon = '24'
  if (rawIcon === 'lg') rawIcon = '32'
  if (rawIcon === 'xl') rawIcon = '40'

  const numIcon = parseInt(rawIcon, 10)
  if (isNaN(numIcon) || numIcon < 10 || numIcon > 160) {
    return NextResponse.json({ error: "İkon boyutu 10px ile 160px arasında olmalıdır." }, { status: 400 })
  }

  const numFont = parseInt(String(body?.font_size || '12'), 10)
  if (isNaN(numFont) || numFont < 8 || numFont > 36) {
    return NextResponse.json({ error: "Yazı boyutu 8px ile 36px arasında olmalıdır." }, { status: 400 })
  }

  const validWeights = ['400', '500', '600', '700', '800', '900']
  const font_weight = validWeights.includes(String(body?.font_weight)) ? String(body.font_weight) : '700'

  const icon_color = String(body?.icon_color || '#C98484').trim()
  const text_color = String(body?.text_color || '#1e293b').trim()
  const icon_bg = String(body?.icon_bg || '#fcf7f6').trim()

  const icon_size = String(numIcon)
  const font_size = String(numFont)

  await query(
    `UPDATE category_settings SET icon_size = $1, font_size = $2, font_weight = $3, icon_color = $4, text_color = $5, icon_bg = $6, updated_at = NOW() WHERE id = 'main'`,
    [icon_size, font_size, font_weight, icon_color, text_color, icon_bg]
  )

  return NextResponse.json({
    success: true,
    icon_size,
    font_size,
    font_weight,
    icon_color,
    text_color,
    icon_bg
  })
}
