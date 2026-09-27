import { NextRequest, NextResponse } from "next/server"
import { validateBirFaturaToken } from "@lib/birfatura/auth"
import { BirFaturaCargoUpdateSchema } from "@lib/birfatura/schemas"
import { updateBirFaturaCargoTracking } from "@lib/birfatura/service"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/orderCargoUpdate & POST /api/orderCargoUpdate/
 * BirFatura Kargo Takip Bilgisi Güncelleme Callback Endpoint'i.
 * Swagger Hub Spec: https://app.swaggerhub.com/apis-docs/birfatura/orders/1.0.0
 */
export async function POST(req: NextRequest) {
  const authError = await validateBirFaturaToken(req)
  if (authError) return authError

  try {
    let rawBody: Record<string, any> = {}
    try {
      const text = await req.text()
      if (text && text.trim().length > 0) {
        rawBody = JSON.parse(text)
      }
    } catch {
      return NextResponse.json(
        { error: "Bad Request: JSON gövdesi geçersiz veya eksik." },
        { status: 400 }
      )
    }

    const parseResult = BirFaturaCargoUpdateSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Bad Request: Geçersiz parametreler.", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const result = await updateBirFaturaCargoTracking(parseResult.data)
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    if (error?.message === "ORDER_NOT_FOUND") {
      return NextResponse.json(
        { error: "Not Found: Sipariş bulunamadı." },
        { status: 404 }
      )
    }

    console.error("[BirFatura] orderCargoUpdate error:", error?.message || error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message || "Sunucu hatası oluştu." },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const authError = await validateBirFaturaToken(req)
  if (authError) return authError

  return NextResponse.json({
    endpoint: "/api/orderCargoUpdate",
    method: "POST",
    description: "BirFatura kargo takip bilgisi güncelleme endpoint'i aktif ve çalışıyor.",
  })
}
