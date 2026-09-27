type StripeIntent = {
  id: string
  client_secret?: string
  status: string
  amount: number
  currency: string
}

type StripeRefund = {
  id: string
  status: "pending" | "requires_action" | "succeeded" | "failed" | "canceled" | null
  amount: number
  currency: string
  failure_reason?: string | null
}

const endpoint = "https://api.stripe.com/v1"

function getSecret() {
  return process.env.STRIPE_SECRET_KEY?.trim() || ""
}

async function stripeRequest(path: string, init?: RequestInit) {
  const key = getSecret()
  if (!key) throw new Error("Stripe gizli anahtarı yapılandırılmamış.")
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || "Ödeme sağlayıcısı isteği başarısız.")
  }
  return data as StripeIntent
}

export function stripeEnabled() {
  return Boolean(
    getSecret() &&
      (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_STRIPE_KEY)
  )
}

export async function createStripeIntent(input: {
  amount: number
  currency: string
  cartId: string
  email?: string | null
}) {
  const body = new URLSearchParams({
    amount: String(input.amount),
    currency: input.currency.toLowerCase(),
    "automatic_payment_methods[enabled]": "true",
    "metadata[cart_id]": input.cartId,
  })
  if (input.email) body.set("receipt_email", input.email)
  return stripeRequest("/payment_intents", { method: "POST", body })
}

export async function retrieveStripeIntent(intentId: string) {
  return stripeRequest(`/payment_intents/${encodeURIComponent(intentId)}`)
}

export async function refundStripePayment(
  intentId: string,
  amount: number,
  reason?: string
) {
  const body = new URLSearchParams({
    payment_intent: intentId,
    amount: String(amount),
  })
  if (reason) body.set("metadata[reason]", reason)
  return stripeRequest("/refunds", { method: "POST", body }) as Promise<StripeRefund>
}
