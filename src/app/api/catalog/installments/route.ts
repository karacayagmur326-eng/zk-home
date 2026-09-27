import { NextRequest, NextResponse } from "next/server"
import { getIyzicoInstallments } from "@lib/payments/iyzico-installments"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const rate = await checkRateLimit(`installments:${requestIp(req)}`, 30, 60)
    if (!rate.allowed) {
      return NextResponse.json({ error: "Çok fazla taksit sorgusu yapıldı." }, { status: 429 })
    }
    const { searchParams } = new URL(req.url)
    const priceParam = searchParams.get("price")
    const price = Number(priceParam)

    if (!Number.isFinite(price) || price <= 0 || price > 100_000_000) {
      return NextResponse.json(
        { error: "Geçerli bir ürün fiyatı belirtilmelidir." },
        { status: 400 }
      )
    }

    const data = await getIyzicoInstallments(price)

    return NextResponse.json({
      ok: true,
      ...data,
    })
  } catch (error: any) {
    console.error("Installment API error:", error)
    return NextResponse.json(
      { error: "Taksit seçenekleri alınamadı." },
      { status: 500 }
    )
  }
}
