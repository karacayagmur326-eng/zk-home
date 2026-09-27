import { NextRequest, NextResponse } from "next/server"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { setRecentOrderAccess } from "@lib/commerce/customer-auth"
import { placeOrder, releaseCartInventoryReservation } from "@lib/data/cart"
import { getBaseURL } from "@lib/util/env"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const baseUrl = getBaseURL()
  await ensureCommerceSchema()

  let token = ""
  try {
    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const jsonBody = await req.json().catch(() => null)
      token = String(jsonBody?.token || "")
    } else {
      const formData = await req.formData().catch(() => null)
      token = String(formData?.get("token") || "")
    }
  } catch {
    token = ""
  }

  if (!token || token.length > 250) {
    return NextResponse.redirect(
      new URL("/sepet?error=" + encodeURIComponent("Geçersiz veya eksik ödeme oturum bilgisi."), baseUrl),
      303
    )
  }

  const carts = await query<{ id: string; completed_at: string | null }>(
    `SELECT id, completed_at FROM store_cart
     WHERE metadata->'payment_data'->>'token' = $1
     ORDER BY updated_at DESC LIMIT 1`,
    [token]
  )
  const cart = carts[0]

  if (!cart) {
    return NextResponse.redirect(
      new URL("/sepet?error=" + encodeURIComponent("Ödeme ile eşleşen sepet oturumu bulunamadı."), baseUrl),
      303
    )
  }

  // If order was already completed, redirect directly to confirmation page
  if (cart.completed_at) {
    const orders = await query<{ id: string }>(
      `SELECT id FROM store_order
       WHERE metadata->>'payment_token' = $1 OR metadata->'payment_data'->>'token' = $1
       ORDER BY created_at DESC LIMIT 1`,
      [token]
    )
    if (orders[0]) {
      await setRecentOrderAccess(orders[0].id)
      return NextResponse.redirect(new URL(`/siparis/${orders[0].id}/confirmed`, baseUrl), 303)
    }
    return NextResponse.redirect(new URL("/hesabim/siparislerim", baseUrl), 303)
  }

  // Attempt to finalize the order
  try {
    await placeOrder(cart.id)
  } catch (error: any) {
    // If Next.js internal redirect was thrown, allow it to complete
    if (
      error?.message === "NEXT_REDIRECT" ||
      String(error?.digest || "").startsWith("NEXT_REDIRECT")
    ) {
      throw error
    }

    // Release reserved inventory on real failure
    await releaseCartInventoryReservation(cart.id).catch(() => {})

    const errorMessage = error?.message || "Ödeme işlemi banka tarafından onaylanamadı veya iptal edildi."
    return NextResponse.redirect(
      new URL(`/sepet?error=${encodeURIComponent(errorMessage)}`, baseUrl),
      303
    )
  }

  // Fallback redirect
  return NextResponse.redirect(new URL("/sepet", baseUrl), 303)
}

export async function GET(req: NextRequest) {
  // Support GET redirect callbacks as well
  const baseUrl = getBaseURL()
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(new URL("/sepet", baseUrl), 303)
  }
  return POST(req)
}
