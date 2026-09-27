import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { revalidatePath, revalidateTag } from "next/cache"

async function ensureMaintenanceColumn() {
  try {
    await query(`
      ALTER TABLE theme_settings 
      ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT 'Sitemiz şu anda planlı bakım çalışması sebebiyle geçici olarak hizmet verememektedir. Kısa süre sonra tekrar hizmetinizde olacağız.';
    `)
  } catch (e) {
    // Column may already exist
  }
}

export async function GET() {
  const session = await getAdminSession(["Admin"])
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  try {
    await ensureMaintenanceColumn()
    const rows = await query<any>("SELECT maintenance_mode, maintenance_message FROM theme_settings WHERE id = 1")
    const s = rows[0] || {}
    return NextResponse.json({
      maintenance_mode: Boolean(s.maintenance_mode),
      maintenance_message: s.maintenance_message || "Sitemiz şu anda planlı bakım çalışması sebebiyle geçici olarak hizmet verememektedir.",
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(["Admin"])
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }

  try {
    await ensureMaintenanceColumn()
    const body = await req.json()
    const maintenance_mode = Boolean(body.maintenance_mode)
    const maintenance_message = typeof body.maintenance_message === "string" && body.maintenance_message.trim()
      ? body.maintenance_message.trim()
      : "Sitemiz şu anda planlı bakım çalışması sebebiyle geçici olarak hizmet verememektedir. Kısa süre sonra tekrar hizmetinizde olacağız."

    await query(
      `UPDATE theme_settings SET maintenance_mode = $1, maintenance_message = $2 WHERE id = 1`,
      [maintenance_mode, maintenance_message]
    )

    try {
      revalidatePath("/", "layout")
      revalidateTag("theme-settings")
    } catch {}

    return NextResponse.json({
      success: true,
      maintenance_mode,
      message: maintenance_mode
        ? "Site başarıyla PAKIM MODUNA ALINDI. Mağaza ziyaretçilere kapatıldı."
        : "Site BAKIM MODUNDAN ÇIKARILDI. Mağaza tekrar yayında!",
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
