import { NextRequest, NextResponse } from "next/server"
import { validateBirFaturaToken } from "@lib/birfatura/auth"
import { BirFaturaInvoiceUpdateSchema } from "@lib/birfatura/schemas"
import { updateBirFaturaInvoiceLinkRecord } from "@lib/birfatura/service"
import { processNotificationOutbox } from "@lib/notifications/outbox"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/invoiceLinkUpdate & POST /api/invoiceLinkUpdate/
 * BirFatura Fatura Bağlantısı Güncelleme Callback Endpoint'i.
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

    const parseResult = BirFaturaInvoiceUpdateSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Bad Request: Geçersiz parametreler.", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const result = await updateBirFaturaInvoiceLinkRecord(parseResult.data)
    const delivery = await processNotificationOutbox(1, [result.notificationId])
    console.warn(JSON.stringify({
      event: "birfatura.invoice_link.saved",
      orderId: result.orderId,
      emailSent: delivery.sent === 1,
      emailConfigured: delivery.configured,
    }))
    return NextResponse.json({
      Success: true,
      Message: result.message,
      EmailSent: delivery.sent === 1,
    }, { status: 200 })
  } catch (error: any) {
    if (error?.message === "ORDER_NOT_FOUND") {
      return NextResponse.json(
        { error: "Not Found: Sipariş bulunamadı." },
        { status: 404 }
      )
    }

    console.error("[BirFatura] invoiceLinkUpdate error:", error?.message || error)
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
    endpoint: "/api/invoiceLinkUpdate",
    method: "POST",
    description: "BirFatura fatura bağlantısı güncelleme endpoint'i aktif ve çalışıyor.",
  })
}
