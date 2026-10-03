import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { createDirectMediaUpload } from "@lib/storage/media-storage"

export async function POST() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const upload = await createDirectMediaUpload()
    return NextResponse.json(upload || { error: "Doğrudan yükleme deposu yapılandırılmamış." }, { status: upload ? 201 : 503 })
  } catch (error) {
    console.error("Direct media upload error:", error)
    return NextResponse.json({ error: "Görsel yükleme izni alınamadı." }, { status: 500 })
  }
}
