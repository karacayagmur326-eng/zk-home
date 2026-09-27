import { NextRequest, NextResponse } from "next/server"
import { validateBirFaturaToken } from "@lib/birfatura/auth"
import { BIRFATURA_ORDER_STATUS_LIST } from "@lib/birfatura/constants"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET & POST /api/orderStatus & /api/orderStatus/
 * BirFatura Sipariş Durumlarını Döner.
 * Swagger Hub Spec: https://app.swaggerhub.com/apis-docs/birfatura/orders/1.0.0
 */
export async function POST(req: NextRequest) {
  const authError = await validateBirFaturaToken(req)
  if (authError) return authError

  try {
    return NextResponse.json(
      { OrderStatus: BIRFATURA_ORDER_STATUS_LIST },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[BirFatura] orderStatus error:", error?.message || error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
