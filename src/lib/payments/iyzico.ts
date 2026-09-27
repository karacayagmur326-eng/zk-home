import "server-only"
import { isStoreReady } from "@lib/security/store-readiness"
import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import { query } from "@lib/admin/db"
import { decryptSettings } from "@lib/security/encrypted-settings"
import { getBaseURL } from "@lib/util/env"
import { normalizeIyzicoBaseUrl, normalizeIyzicoCallbackUrl } from "./iyzico-url"

export type IyzicoConfig = {
  apiKey: string
  secretKey: string
  baseUrl: string
  callbackUrl: string
  environment: "test" | "production"
  enabledInstallments?: number[]
}

export type IyzicoResponse = Record<string, any> & {
  status?: string
  errorMessage?: string
  errorCode?: string
  signature?: string
}

function money(value: unknown): string {
  const number = Number(value)
  if (!Number.isFinite(number)) return "0"
  return number.toFixed(8).replace(/\.?0+$/, "")
}

function safeEqual(received: unknown, expected: string): boolean {
  if (!received || typeof received !== "string") return false
  const left = Buffer.from(received.toLowerCase())
  const right = Buffer.from(expected.toLowerCase())
  return left.length === right.length && timingSafeEqual(left, right)
}

function responseSignature(secretKey: string, values: unknown[]): string {
  const normalized = values.map((value) =>
    typeof value === "number" ? money(value) : String(value ?? "")
  )
  return createHmac("sha256", secretKey)
    .update(normalized.join(":"))
    .digest("hex")
}

/**
 * iyzico IYZWSv2 HMAC-SHA256 Authorization Header Generator
 * Standard format: IYZWSv2 base64(apiKey:xxx&randomKey:yyy&signature:zzz)
 */
export function authorization(
  apiKey: string,
  secretKey: string,
  path: string,
  body: string
) {
  const randomKey = `${Date.now()}${randomBytes(8).toString("hex")}`
  const signature = createHmac("sha256", secretKey)
    .update(`${randomKey}${path}${body}`, "utf8")
    .digest("hex")
  return {
    authorization: `IYZWSv2 ${Buffer.from(
      `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`
    ).toString("base64")}`,
    randomKey,
  }
}

/**
 * Turkish Error Translator for common iyzico response error codes
 */
export function mapIyzicoError(data: IyzicoResponse): string {
  const code = String(data.errorCode || "")
  const msg = data.errorMessage || ""

  const ERROR_MAP: Record<string, string> = {
    "10100": "Geçersiz API Anahtarı veya Gizli Anahtar. iyzico paneli ayarlarınızı kontrol edin.",
    "10200": "Kimlik doğrulama başarısız. API anahtarlarınızı kontrol edin.",
    "5006": "Geçersiz kimlik / vergi numarası bilgisi.",
    "5004": "Kart limiti yetersiz veya işlem banka tarafından reddedildi.",
    "5138": "Kart bakiyesi yetersiz.",
    "5001": "Kart bilgileri hatalı veya kart e-ticaret kullanımına kapalı.",
    "5012": "3D Secure doğrulaması başarısız veya zaman aşımına uğradı.",
    "5049": "Güvenlik veya dolandırıcılık (fraud) kontrolü nedeniyle ödeme onaylanamadı.",
    "5083": "Kart numarası geçersiz.",
    "5084": "Kart son kullanma tarihi geçersiz.",
    "5085": "Kart CVV / CVC güvenlik kodu geçersiz.",
  }

  if (ERROR_MAP[code]) return ERROR_MAP[code]
  if (msg) return msg
  return "Ödeme işlemi banka veya sağlayıcı tarafından onaylanamadı."
}

async function request(
  config: IyzicoConfig,
  path: string,
  payload: Record<string, unknown>
): Promise<IyzicoResponse> {
  const body = JSON.stringify(payload)
  const auth = authorization(config.apiKey, config.secretKey, path, body)

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: auth.authorization,
      "x-iyzi-rnd": auth.randomKey,
      "x-iyzi-client-version": "iyzipay-node-2.0.0",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  })

  const data = (await response.json().catch(() => ({}))) as IyzicoResponse
  if (!response.ok || data.status !== "success") {
    throw new Error(mapIyzicoError(data))
  }
  return data
}

export async function getIyzicoConfig(): Promise<IyzicoConfig | null> {
  const rows = await query<any>(
    `SELECT enabled,environment,public_config,encrypted_config
     FROM store_integration WHERE provider='iyzico' LIMIT 1`
  ).catch(() => [])
  const integration = rows[0]
  const secrets = decryptSettings(integration?.encrypted_config)
  const apiKey = secrets.api_key || process.env.IYZICO_API_KEY || ""
  const secretKey = secrets.secret_key || process.env.IYZICO_SECRET_KEY || ""
  const isProduction = integration?.environment === "production" || !apiKey.startsWith("sandbox-")
  const baseUrl = normalizeIyzicoBaseUrl(
    integration?.public_config?.api_url ||
      process.env.IYZICO_BASE_URL,
    isProduction
  )
  const callbackUrl = normalizeIyzicoCallbackUrl(
    integration?.public_config?.callback_url ||
      `${getBaseURL()}/api/payments/iyzico/callback`,
    getBaseURL()
  )

  if (
    !integration?.enabled ||
    !apiKey ||
    !secretKey ||
    !baseUrl ||
    !callbackUrl
  ) {
    return null
  }

  const enabledInstallments = Array.isArray(integration?.public_config?.enabled_installments)
    ? integration.public_config.enabled_installments
    : [1, 2, 3, 6, 9, 12]

  return {
    apiKey,
    secretKey,
    baseUrl,
    callbackUrl,
    environment: isProduction ? "production" : "test",
    enabledInstallments,
  }
}

export async function iyzicoEnabled(): Promise<boolean> {
  return Boolean(await getIyzicoConfig())
}

function address(value: any) {
  const contactName = `${value?.first_name || "Misafir"} ${value?.last_name || "Müşteri"}`.trim()
  const city = String(value?.city || "İstanbul").trim() || "İstanbul"
  const rawAddress = `${value?.address_1 || ""} ${value?.address_2 || ""}`.trim()
  const addr = rawAddress.length >= 2 ? rawAddress : `${city}, Türkiye`
  const zipCode = String(value?.postal_code || "34000").trim() || "34000"

  return {
    contactName,
    city,
    country: "Türkiye",
    address: addr,
    zipCode,
  }
}

function phone(value: unknown): string {
  const digits = String(value || "").replace(/\D/g, "")
  if (!digits) return "+905555555555"
  if (digits.startsWith("90")) return `+${digits}`
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`
  return `+90${digits}`
}

/**
 * Initializes iyzico Checkout Form session for cart
 */
export async function initializeIyzicoCheckout(input: {
  cart: any
  taxNumber?: string
  ip: string
}) {
  const config = await getIyzicoConfig()
  if (!config) throw new Error("iyzico entegrasyonu etkin ve eksiksiz değil.")

  const cart = input.cart
  if (input.taxNumber && !/^\d{10,11}$/.test(input.taxNumber)) {
    throw new Error("Kurumsal fatura için geçerli VKN bilgisi (10 veya 11 hane) gereklidir.")
  }

  const path = "/payment/iyzipos/checkoutform/initialize/auth/ecom"
  const shipping = address(cart.shipping_address)
  const billing = address(cart.billing_address || cart.shipping_address)

  // Basket Items Mapping & Price Normalization
  let items = (cart.items || []).map((item: any) => ({
    id: String(item.variant_id || item.id || `item_${Date.now()}`),
    name: String(item.title || "Ürün").slice(0, 120),
    category1: String(item.product?.subtitle || item.product?.category?.name || "Genel").slice(0, 60),
    itemType: "PHYSICAL",
    price: Number((Number(item.total || item.unit_price || 0) / 100).toFixed(2)),
  }))

  if (items.length === 0) {
    items = [
      {
        id: String(cart.id),
        name: "Sipariş Sepeti",
        category1: "Genel",
        itemType: "PHYSICAL",
        price: Number((Number(cart.total || 0) / 100).toFixed(2)),
      },
    ]
  }

  // Calculate exact basket sum to ensure sum(basketItems.price) === price
  const calculatedPrice = Number(
    items.reduce((sum: number, item: any) => sum + Number(item.price), 0).toFixed(2)
  )
  const paidPrice = Number((Number(cart.total || 0) / 100).toFixed(2))

  // Mandatory identity number: Tax number for corporate or fallback 11111111111 for standard B2C
  const identityNumber =
    input.taxNumber ||
    (cart.metadata as any)?.tax_number ||
    (cart.shipping_address as any)?.metadata?.tckn ||
    "11111111111"

  const payload = {
    locale: "tr",
    conversationId: cart.id,
    price: calculatedPrice > 0 ? calculatedPrice : paidPrice,
    paidPrice: paidPrice > 0 ? paidPrice : 1.0,
    currency: "TRY",
    basketId: cart.id,
    paymentGroup: "PRODUCT",
    callbackUrl: config.callbackUrl,
    enabledInstallments: config.enabledInstallments || [1, 2, 3, 6, 9, 12],
    buyer: {
      id: String(cart.customer_id || cart.id),
      name: String(cart.shipping_address?.first_name || "Misafir").trim() || "Misafir",
      surname: String(cart.shipping_address?.last_name || "Müşteri").trim() || "Müşteri",
      gsmNumber: phone(cart.shipping_address?.phone),
      email: String(cart.email || "destek@zk-home.com").trim(),
      identityNumber,
      registrationAddress: shipping.address,
      ip: input.ip || "127.0.0.1",
      city: shipping.city,
      country: shipping.country,
      zipCode: shipping.zipCode,
    },
    shippingAddress: shipping,
    billingAddress: billing,
    basketItems: items,
  }

  const data = await request(config, path, payload)

  // Verify signature if provided by iyzico
  if (data.signature) {
    const expected = responseSignature(config.secretKey, [
      data.conversationId,
      data.token,
    ])
    if (!safeEqual(data.signature, expected)) {
      throw new Error("iyzico ödeme oturumu imzası doğrulanamadı.")
    }
  }

  if (data.conversationId !== cart.id || !data.token || !data.paymentPageUrl) {
    throw new Error("iyzico ödeme formu oturumu başlatılamadı.")
  }

  return {
    token: String(data.token),
    paymentUrl: String(data.paymentPageUrl),
    checkoutFormContent: data.checkoutFormContent ? String(data.checkoutFormContent) : null,
    conversationId: cart.id,
  }
}

/**
 * Retrieves and validates the final checkout form payment result
 */
export async function retrieveIyzicoCheckout(input: {
  token: string
  conversationId: string
}) {
  const config = await getIyzicoConfig()
  if (!config) throw new Error("iyzico entegrasyonu etkin değil.")

  const path = "/payment/iyzipos/checkoutform/auth/ecom/detail"
  const data = await request(config, path, {
    locale: "tr",
    conversationId: input.conversationId,
    token: input.token,
  })

  // Verify signature if returned by iyzico
  if (data.signature) {
    const expected = responseSignature(config.secretKey, [
      data.paymentStatus,
      data.paymentId,
      data.currency,
      data.basketId,
      data.conversationId,
      money(data.paidPrice),
      money(data.price),
      data.token,
    ])
    if (!safeEqual(data.signature, expected)) {
      throw new Error("iyzico ödeme sonucu imzası doğrulanamadı.")
    }
  }

  return data
}

/**
 * Initiates a refund for an iyzico payment
 */
export async function refundIyzicoPayment(input: {
  paymentId: string
  amount: number
  conversationId: string
  ip: string
}) {
  const config = await getIyzicoConfig()
  if (!config) throw new Error("iyzico entegrasyonu etkin değil.")

  const path = "/v2/payment/refund"
  const price = Number((input.amount / 100).toFixed(2))

  const data = await request(config, path, {
    locale: "tr",
    conversationId: input.conversationId,
    paymentId: input.paymentId,
    price,
    currency: "TRY",
    ip: input.ip || "127.0.0.1",
  })

  if (data.signature) {
    const expected = responseSignature(config.secretKey, [
      data.paymentId,
      money(data.price),
      data.currency,
      data.conversationId,
    ])
    if (!safeEqual(data.signature, expected)) {
      throw new Error("iyzico iade yanıtı imzası doğrulanamadı.")
    }
  }

  return {
    id: String(data.refundHostReference || data.authCode || data.paymentId),
    status: "succeeded" as const,
  }
}
