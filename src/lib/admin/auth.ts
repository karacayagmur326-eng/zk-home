import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { createHmac, timingSafeEqual } from "crypto"

const jwtSecret = process.env.ADMIN_JWT_SECRET
const ADMIN_TOTP_SECRET = process.env.ADMIN_TOTP_SECRET

const COOKIE_NAME = "zkhome_admin_token"

function getJwtSecret(): Uint8Array | null {
  if (jwtSecret) return new TextEncoder().encode(jwtSecret)
  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("zkhome-development-only-admin-secret")
  }
  return null
}

export type AdminRole = "Admin" | "Yönetici" | "Editör"

const ADMIN_ROLES: AdminRole[] = ["Admin", "Yönetici", "Editör"]

export async function signAdminToken(
  email: string,
  role: AdminRole = "Admin"
): Promise<string> {
  const secret = getJwtSecret()
  if (!secret) {
    throw new Error("Yönetici oturum güvenliği yapılandırılmamış.")
  }
  return await new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("zkhome-admin-v2")
    .setAudience("zkhome-admin")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyAdminToken(
  token: string
): Promise<{ email: string; role: AdminRole | null } | null> {
  try {
    const secret = getJwtSecret()
    if (!secret) return null
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"], issuer: "zkhome-admin-v2", audience: "zkhome-admin",
    })
    if (typeof payload.email !== "string" || !payload.email || !payload.exp) return null
    const role = ADMIN_ROLES.includes(payload.role as AdminRole)
      ? (payload.role as AdminRole)
      : null
    return { email: payload.email as string, role }
  } catch {
    return null
  }
}

export async function getAdminSession(
  allowedRoles: AdminRole[] = ADMIN_ROLES
): Promise<{ email: string; role: AdminRole } | null> {
  // 1. Master admin cookie kontrolü
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (token) {
    const verified = await verifyAdminToken(token)
    if (verified?.role && allowedRoles.includes(verified.role)) {
      return {
        email: verified.email || process.env.ADMIN_EMAIL || "admin@zk-home.com",
        role: verified.role,
      }
    }
  }

  // 2. Storefront customer session üzerinden Editör/Yönetici/Admin rolü kontrolü
  try {
    const { getCustomerSessionId } = await import("@lib/commerce/customer-auth")
    const { query } = await import("@lib/admin/db")
    const customerId = await getCustomerSessionId().catch(() => null)
    // The legacy bootstrap account may retain an old default password in the
    // database. It must use the dedicated admin login, never the customer bridge.
    if (customerId && customerId !== "cust_admin_master") {
      const rows = await query<any>(
        `SELECT email, role FROM store_customer WHERE id=$1 AND COALESCE(status,'Aktif')='Aktif' LIMIT 1`,
        [customerId]
      )
      const user = rows[0]
      if (
        user &&
        ADMIN_ROLES.includes(user.role) &&
        allowedRoles.includes(user.role)
      ) {
        return { email: user.email, role: user.role }
      }
    }
  } catch {
    // customer session yoksa devam et
  }

  return null
}

export function checkPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD?.trim()
  if (!configured || !password) return false
  const supplied = Buffer.from(password)
  const expected = Buffer.from(configured)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

function decodeBase32(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const normalized = value.toUpperCase().replace(/[^A-Z2-7]/g, "")
  let bits = ""

  for (const character of normalized) {
    const index = alphabet.indexOf(character)
    if (index < 0) return Buffer.alloc(0)
    bits += index.toString(2).padStart(5, "0")
  }

  const bytes: number[] = []
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2))
  }
  return Buffer.from(bytes)
}

function totpAt(secret: Buffer, counter: number): string {
  const message = Buffer.alloc(8)
  message.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac("sha1", secret).update(message).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const value =
    (((digest[offset] & 0x7f) << 24) |
      (digest[offset + 1] << 16) |
      (digest[offset + 2] << 8) |
      digest[offset + 3]) %
    1_000_000
  return value.toString().padStart(6, "0")
}

/** RFC 6238 TOTP verification. TOTP remains optional until a secret is configured. */
export function verifyAdminTotp(code: string): boolean {
  if (!ADMIN_TOTP_SECRET) return true
  const supplied = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(supplied)) return false

  const secret = decodeBase32(ADMIN_TOTP_SECRET)
  if (!secret.length) return false
  const counter = Math.floor(Date.now() / 30_000)

  return [-1, 0, 1].some((drift) => {
    const expected = Buffer.from(totpAt(secret, counter + drift))
    const candidate = Buffer.from(supplied)
    return timingSafeEqual(candidate, expected)
  })
}

export { COOKIE_NAME }
