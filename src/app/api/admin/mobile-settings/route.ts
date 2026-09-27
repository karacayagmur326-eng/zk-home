import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { getMobileSettings, saveMobileSettings } from "@lib/content/mobile-settings"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  return NextResponse.json({ settings: await getMobileSettings() })
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  try {
    const body = await request.json()
    const settings = await saveMobileSettings(body.settings || body)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Mobile settings save failed", error)
    return NextResponse.json({ error: "Mobil ayarlar kaydedilemedi." }, { status: 500 })
  }
}
