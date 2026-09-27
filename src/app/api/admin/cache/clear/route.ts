import { NextResponse } from "next/server"
import { flushAllSiteCache } from "@lib/cache"
import { getAdminSession } from "@lib/admin/auth"

export async function POST() {
  const session = await getAdminSession(["Admin"])
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  }

  try {
    const result = await flushAllSiteCache()
    return NextResponse.json({
      success: true,
      message: "Tüm site önbelleği ve veritabanı önbellekleri başarıyla temizlendi ve yenilendi.",
      details: result,
    })
  } catch (error: any) {
    console.error("Cache clear error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Önbellek temizlenirken bir hata oluştu: " + (error?.message || "Bilinmeyen hata"),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Bu işlem yalnızca POST isteğiyle kullanılabilir." },
    { status: 405, headers: { Allow: "POST" } }
  )
}
