import { NextRequest, NextResponse } from "next/server"
import { createHmac, randomBytes } from "crypto"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { normalizeIyzicoBaseUrl } from "@lib/payments/iyzico-url"

async function authorize() {
  return Boolean(await getAdminSession(["Admin"]))
}

// ─── iyzico HMAC-SHA256 Auth Header ────────────────────────────────────────
function buildIyzicoAuthHeader(
  apiKey: string,
  secretKey: string,
  randomString: string,
  path: string,
  body: string
): string {
  const dataToSign = randomString + path + body
  const signature = createHmac("sha256", secretKey)
    .update(dataToSign, "utf8")
    .digest("hex")
  const authData = `apiKey:${apiKey}&randomKey:${randomString}&signature:${signature}`
  return `IYZWSv2 ${Buffer.from(authData).toString("base64")}`
}

// ─── iyzico Test ────────────────────────────────────────────────────────────
async function testIyzico(
  apiKey: string,
  secretKey: string,
  environment: string,
  customApiUrl?: string
): Promise<{ success: boolean; message: string; code?: string }> {
  if (!apiKey || !secretKey) {
    return { success: false, message: "API Anahtarı ve Gizli Anahtar zorunludur." }
  }

  const baseUrl = normalizeIyzicoBaseUrl(
    customApiUrl,
    environment === "production" || !apiKey.startsWith("sandbox-")
  )

  // Universal BIN check endpoint supported on 100% of iyzico live/sandbox accounts
  const endpoint = "/payment/bin/check"
  const requestUrl = `${baseUrl}${endpoint}`

  const body = JSON.stringify({
    locale: "tr",
    conversationId: `test-${Date.now()}`,
    binNumber: "552879",
  })

  const randomString = randomBytes(8).toString("hex")
  const authorization = buildIyzicoAuthHeader(
    apiKey,
    secretKey,
    randomString,
    endpoint,
    body
  )

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authorization,
        "x-iyzi-rnd": randomString,
        "x-iyzi-client-version": "iyzipay-node-2.0.0",
      },
      body,
      signal: AbortSignal.timeout(12000),
    })

    const data = await response.json().catch(() => ({}))

    // iyzico returns status "success" or "failure" in body
    if (data.status === "success") {
      const modeLabel = environment === "production" ? "Canlı (Production)" : "Test (Sandbox)"
      return {
        success: true,
        message: `iyzico ${modeLabel} bağlantısı başarıyla doğrulandı. API bilgileri geçerli ve çalışıyor.`,
      }
    }

    // 401 / 10100 = unauthorized (invalid api key/secret)
    if (
      response.status === 401 ||
      data.errorCode === "10100" ||
      data.errorCode === "10200"
    ) {
      return {
        success: false,
        message: "Geçersiz API Anahtarı veya Gizli Anahtar. Lütfen iyzico panelinizdeki doğru ortam (Canlı/Test) anahtarlarını girdiğinizden emin olun.",
        code: data.errorCode,
      }
    }

    return {
      success: false,
      message: `iyzico yanıt verdi fakat doğrulanamadı: ${data.errorMessage || "HTTP " + response.status}`,
    }
  } catch (error: any) {
    if (error.name === "TimeoutError" || error.code === "ECONNABORTED") {
      return { success: false, message: "iyzico sunucusuna bağlanılamadı. Bağlantı zaman aşımına uğradı." }
    }
    return { success: false, message: `Bağlantı hatası: ${error.message}` }
  }
}

// ─── BirFatura Test ─────────────────────────────────────────────────────────
async function testBirfatura(
  apiKey: string,
  _username?: string,
  _password?: string,
  _environment?: string
): Promise<{ success: boolean; message: string }> {
  const token = (apiKey || _password || "").trim()
  if (!token) {
    return {
      success: false,
      message: "BirFatura API Şifresi / Token (GUID) zorunludur.",
    }
  }
  if (token.length < 6) {
    return {
      success: false,
      message: "API Token çok kısa. Lütfen geçerli bir GUID veya güvenli token girin.",
    }
  }

  return {
    success: true,
    message: "BirFatura API Token formatı doğrulandı. Entegrasyonu aktif edip değişiklikleri kaydedebilirsiniz.",
  }
}

// ─── Route Handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await authorize()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  const body = await req.json()
  const { provider, api_key, secret_key, username, password, environment, api_url } = body

  if (!provider) {
    return NextResponse.json({ error: "Provider belirtilmedi." }, { status: 400 })
  }

  // If no credentials passed in body, try loading from DB
  let finalApiKey = String(api_key || "").trim()
  let finalSecretKey = String(secret_key || "").trim()
  let finalUsername = String(username || "").trim()
  let finalPassword = String(password || "").trim()
  let finalEnvironment = String(environment || "test").trim()
  let finalApiUrl = String(api_url || "").trim()

  if (!finalApiKey) {
    // Load saved secrets from DB
    const rows = await query<{ encrypted_config: string | null; environment: string; public_config: any }>(
      "SELECT encrypted_config, environment, public_config FROM store_integration WHERE provider=$1",
      [provider]
    )
    if (rows[0]) {
      const { decryptSettings } = await import("@lib/security/encrypted-settings")
      const secrets = decryptSettings(rows[0].encrypted_config)
      finalApiKey = finalApiKey || (secrets.api_key as string) || ""
      finalSecretKey = finalSecretKey || (secrets.secret_key as string) || ""
      finalUsername = finalUsername || (secrets.username as string) || ""
      finalPassword = finalPassword || (secrets.password as string) || ""
      finalEnvironment = finalEnvironment || rows[0].environment || "test"
      finalApiUrl = finalApiUrl || rows[0].public_config?.api_url || ""
    }
  }

  let result: { success: boolean; message: string; code?: string }

  if (provider === "iyzico" || body.type === "payment") {
    result = await testIyzico(finalApiKey, finalSecretKey, finalEnvironment, finalApiUrl)
  } else if (provider === "birfatura" || body.type === "invoice") {
    result = await testBirfatura(finalApiKey, finalUsername, finalPassword, finalEnvironment)
  } else {
    result = finalApiKey
      ? { success: true, message: "Kimlik bilgileri mevcut. Özel entegrasyon için manuel doğrulama gereklidir." }
      : { success: false, message: "API anahtarı girilmeden bağlantı test edilemez." }
  }

  return NextResponse.json(result, { status: result.success ? 200 : 422 })
}
