import "server-only"
import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const COOKIE_NAME = "_zkhome_customer_session"
const RECENT_ORDER_COOKIE = "_zkhome_recent_order"
function getCustomerSecret(): Uint8Array | null {
  const configured =
    process.env.CUSTOMER_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET
  if (configured) return new TextEncoder().encode(configured)
  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("zkhome-development-only-customer-secret")
  }
  return null
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function setCustomerSession(customerId: string) {
  const secret = getCustomerSecret()
  if (!secret) throw new Error("Müşteri oturum güvenliği yapılandırılmamış.")
  const token = await new SignJWT({ customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
}

export async function getCustomerSessionId() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const secret = getCustomerSecret()
    if (!secret) return null
    const { payload } = await jwtVerify(token, secret)
    return typeof payload.customerId === "string" ? payload.customerId : null
  } catch {
    return null
  }
}

export async function clearCustomerSession() {
  ;(await cookies()).set(COOKIE_NAME, "", { maxAge: -1, path: "/" })
}

export async function setRecentOrderAccess(orderId: string) {
  const secret = getCustomerSecret()
  if (!secret) throw new Error("Sipariş erişim güvenliği yapılandırılmamış.")
  const token = await new SignJWT({ orderId, purpose: "recent-order" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret)
  ;(await cookies()).set(RECENT_ORDER_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 2,
    path: "/",
  })
}

export async function getRecentOrderAccessId() {
  const token = (await cookies()).get(RECENT_ORDER_COOKIE)?.value
  if (!token) return null
  try {
    const secret = getCustomerSecret()
    if (!secret) return null
    const { payload } = await jwtVerify(token, secret)
    return payload.purpose === "recent-order" &&
      typeof payload.orderId === "string"
      ? payload.orderId
      : null
  } catch {
    return null
  }
}
