import { NextRequest, NextResponse } from "next/server"
import { validateBirFaturaToken } from "@lib/birfatura/auth"
import { BIRFATURA_PAYMENT_METHODS_LIST } from "@lib/birfatura/constants"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET & POST /api/paymentMethods & /api/paymentMethods/
 * BirFatura Ödeme Yöntemlerini Döner.
 * Swagger Hub Spec: https://app.swaggerhub.com/apis-docs/birfatura/orders/1.0.0
 */
export async function POST(req: NextRequest) {
  const authError = await validateBirFaturaToken(req)
  if (authError) return authError

  try {
    return NextResponse.json(
      { PaymentMethods: BIRFATURA_PAYMENT_METHODS_LIST },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[BirFatura] paymentMethods error:", error?.message || error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
