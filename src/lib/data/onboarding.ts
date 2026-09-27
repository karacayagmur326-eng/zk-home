"use server"
import { cookies as nextCookies } from "next/headers"
import { redirect } from "next/navigation"

export async function resetOnboardingState(orderId: string) {
  const cookies = await nextCookies()
  cookies.set("_zkhome_onboarding", "false", { maxAge: -1 })
  const adminUrl = process.env.MEDUSA_ADMIN_URL || process.env.MEDUSA_BACKEND_URL
  if (!adminUrl) {
    redirect(`/hesabim/siparislerim/detaylar/${orderId}`)
  }
  redirect(`${adminUrl.replace(/\/+$/, "")}/a/orders/${encodeURIComponent(orderId)}`)
}
