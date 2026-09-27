import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { query } from "@lib/admin/db"
import { decryptSettings } from "@lib/security/encrypted-settings"

/**
 * Extracts incoming BirFatura API Token from various possible header / parameter locations:
 * 1. Headers: 'Token', 'token', 'x-token', 'x-api-key', 'apiKey', 'ApiKey'
 * 2. Authorization: 'Bearer <token>' or '<token>'
 * 3. URL search parameters: '?token=...', '?Token=...', '?apiKey=...'
 */
export function extractIncomingToken(req: NextRequest): string {
  // 1. Direct custom headers
  const headerToken = (
    req.headers.get("token") ||
    req.headers.get("Token") ||
    req.headers.get("x-token") ||
    req.headers.get("x-api-key") ||
    req.headers.get("apikey") ||
    req.headers.get("apiKey") ||
    req.headers.get("ApiKey") ||
    ""
  ).trim()

  if (headerToken) return headerToken

  // 2. Authorization header
  const authHeader = (req.headers.get("authorization") || req.headers.get("Authorization") || "").trim()
  if (authHeader) {
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      return authHeader.substring(7).trim()
    }
    return authHeader
  }

  // 3. URL Search parameters
  const queryToken = (
    req.nextUrl.searchParams.get("token") ||
    req.nextUrl.searchParams.get("Token") ||
    req.nextUrl.searchParams.get("apiKey") ||
    req.nextUrl.searchParams.get("api_key") ||
    ""
  ).trim()

  if (queryToken) return queryToken

  return ""
}

/**
 * BirFatura API Token doğrulama yardımcısı.
 * 
 * Token öncelikle veritabanındaki aktif store_integration (provider='birfatura' veya integration_type='invoice')
 * kaydından dinamik olarak okunur ve çözülür.
 * 
 * - Multi-tenant / çoklu müşteri uyumludur: her mağaza kendi token'ını admin panelinden yönetir.
 * - Admin panelinden pasif yapılırsa veya token değiştirilirse anında geçerli olur.
 * - Admin panelinde henüz kayıt yoksa sunucu ortam değişkeni (BIRFATURA_API_TOKEN) fallback olarak kullanılır.
 */
export async function validateBirFaturaToken(req: NextRequest): Promise<NextResponse | null> {
  const incomingToken = extractIncomingToken(req)

  if (!incomingToken) {
    return NextResponse.json(
      { error: "Unauthorized: Eksik veya geçersiz token (Header veya parametre olarak 'Token' gönderilmelidir)." },
      { status: 401 }
    )
  }

  // 1. Veritabanından tanımlı BirFatura / Fatura entegrasyonlarını sorgula
  try {
    const rows = await query<{
      provider: string
      enabled: boolean
      encrypted_config: string | null
      public_config: any
    }>(
      `SELECT provider, enabled, encrypted_config, public_config
       FROM store_integration
       WHERE (provider = 'birfatura' OR integration_type = 'invoice' OR name ILIKE '%birfatura%')
       ORDER BY CASE WHEN provider = 'birfatura' THEN 0 ELSE 1 END, updated_at DESC`
    )

    if (rows.length > 0) {
      // Aktif olan kayıtları kontrol et
      const activeRows = rows.filter((r) => r.enabled && r.encrypted_config)

      for (const row of activeRows) {
        const secrets = decryptSettings(row.encrypted_config)
        const configuredToken = String(
          secrets.api_key || secrets.secret_key || secrets.password || ""
        ).trim()

        if (configuredToken && isTokenMatch(incomingToken, configuredToken)) {
          // Token eşleşti ve entegrasyon aktif
          return null
        }
      }

      // Eğer kayıtlar var ama hiçbiri aktif değilse veya token uyuşmuyorsa
      const hasAnyActive = rows.some((r) => r.enabled)
      if (!hasAnyActive) {
        return NextResponse.json(
          { error: "Unauthorized: BirFatura entegrasyonu admin panelinde pasif durumda." },
          { status: 401 }
        )
      }
    }
  } catch (err) {
    console.error("[BirFatura] DB token verification error:", err)
  }

  // 2. Fallback: Ortam değişkeni kontrolü (DB'de kayıt yoksa)
  const envToken = (process.env.BIRFATURA_API_TOKEN || "").trim()
  if (envToken && isTokenMatch(incomingToken, envToken)) {
    return null
  }

  return NextResponse.json(
    { error: "Unauthorized: Geçersiz BirFatura API Token veya entegrasyon aktif değil." },
    { status: 401 }
  )
}

function isTokenMatch(aStr: string, bStr: string): boolean {
  try {
    const a = Buffer.from(aStr, "utf8")
    const b = Buffer.from(bStr, "utf8")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return aStr === bStr
  }
}
