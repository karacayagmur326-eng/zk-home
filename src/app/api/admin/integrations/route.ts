import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { decryptSettings, encryptSettings } from "@lib/security/encrypted-settings"

const SECRET_FIELDS = ["api_key", "secret_key", "username", "password"] as const

async function authorize() {
  return Boolean(await getAdminSession(["Admin"]))
}

function text(value: unknown) {
  return String(value || "").trim()
}

function typeOf(value: unknown) {
  return value === "invoice" ? "invoice" : "payment"
}

function publicConfig(body: any) {
  let apiUrl = text(body.public_config?.api_url)
  if (body.provider === "iyzico" || body.type === "payment") {
    if (
      !apiUrl ||
      apiUrl.includes("merchant.iyzipay.com") ||
      apiUrl.includes("sandbox.iyzipay.com")
    ) {
      apiUrl =
        body.environment === "production"
          ? "https://api.iyzipay.com"
          : "https://sandbox-api.iyzipay.com"
    }
  }
  return {
    api_url: apiUrl,
    merchant_id: text(body.public_config?.merchant_id),
    callback_url: text(body.public_config?.callback_url),
    store_code: text(body.public_config?.store_code),
    auto_invoice: Boolean(body.public_config?.auto_invoice),
    notes: text(body.public_config?.notes),
    logo_url: text(body.public_config?.logo_url),
    badge_text: text(body.public_config?.badge_text),
    description: text(body.public_config?.description),
  }
}

async function seedDefaults() {
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO store_integration
        (provider,name,integration_type,enabled,environment,public_config)
       VALUES
        ('iyzico','iyzico Ödeme','payment',FALSE,'test','{"description":"Kredi kartı ve online ödeme altyapısı","badge_text":"Ödeme Yöntemi"}'::jsonb),
        ('birfatura','BirFatura E-Fatura','invoice',FALSE,'production','{"description":"BirFatura Özel Entegrasyonu ve E-Fatura Sistemi","badge_text":"Faturalama Sistemi","auto_invoice":false}'::jsonb)
       ON CONFLICT (provider) DO UPDATE SET
        name = COALESCE(store_integration.name, EXCLUDED.name),
        integration_type = EXCLUDED.integration_type`
    )
  })
}

export async function GET() {
  if (!(await authorize()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  await seedDefaults()
  const rows = await query<any>(
    `SELECT provider,name,integration_type,enabled,environment,public_config,
            encrypted_config,updated_at
     FROM store_integration ORDER BY integration_type,name,provider`
  )
  return NextResponse.json({
    integrations: rows.map((row) => {
      const secrets = decryptSettings(row.encrypted_config)
      return {
        provider: row.provider,
        name: row.name || row.provider,
        integration_type: row.integration_type,
        enabled: row.enabled,
        environment: row.environment,
        public_config: row.public_config || {},
        secrets,
        secret_status: Object.fromEntries(
          SECRET_FIELDS.map((field) => [field, Boolean(secrets[field])])
        ),
        updated_at: row.updated_at,
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  if (!(await authorize()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const body = await req.json()
  const name = text(body.name)
  if (!name)
    return NextResponse.json({ error: "Entegrasyon adı zorunludur." }, { status: 400 })
  const provider = `custom_${typeOf(body.integration_type)}_${randomUUID().replaceAll("-", "")}`
  await query(
    `INSERT INTO store_integration
      (provider,name,integration_type,enabled,environment,public_config)
     VALUES ($1,$2,$3,FALSE,'test','{}'::jsonb)`,
    [provider, name, typeOf(body.integration_type)]
  )
  return NextResponse.json({ success: true, provider, message: "Yeni entegrasyon eklendi." })
}

export async function PATCH(req: NextRequest) {
  if (!(await authorize()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const body = await req.json()
  const provider = text(body.provider)
  const name = text(body.name) || (provider === "birfatura" ? "BirFatura E-Fatura" : provider === "iyzico" ? "iyzico Ödeme" : "Entegrasyon")
  if (!provider)
    return NextResponse.json({ error: "Entegrasyon bilgileri eksik." }, { status: 400 })

  const existing = await query<{ encrypted_config: string | null }>(
    "SELECT encrypted_config FROM store_integration WHERE provider=$1",
    [provider]
  )

  const secrets = (body.clear_secrets || !existing[0]) ? {} : decryptSettings(existing[0].encrypted_config)
  for (const field of SECRET_FIELDS) {
    const supplied = text(body.secrets?.[field])
    if (supplied) secrets[field] = supplied
  }

  const encrypted = Object.keys(secrets).length ? encryptSettings(secrets) : (existing[0]?.encrypted_config || null)
  const pub = JSON.stringify(publicConfig(body))
  const env = body.environment === "production" ? "production" : "test"
  const intType = typeOf(body.integration_type)
  const isEnabled = Boolean(body.enabled)

  await query(
    `INSERT INTO store_integration (provider, name, integration_type, enabled, environment, public_config, encrypted_config, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW())
     ON CONFLICT (provider) DO UPDATE SET
       name = EXCLUDED.name,
       integration_type = EXCLUDED.integration_type,
       enabled = EXCLUDED.enabled,
       environment = EXCLUDED.environment,
       public_config = EXCLUDED.public_config,
       encrypted_config = COALESCE(EXCLUDED.encrypted_config, store_integration.encrypted_config),
       updated_at = NOW()`,
    [provider, name, intType, isEnabled, env, pub, encrypted]
  )
  return NextResponse.json({ success: true, message: "Entegrasyon başarıyla kaydedildi." })
}

export async function DELETE(req: NextRequest) {
  if (!(await authorize()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const provider = new URL(req.url).searchParams.get("provider")
  if (!provider)
    return NextResponse.json({ error: "Silinecek entegrasyon seçilmedi." }, { status: 400 })
  const removed = await query(
    "DELETE FROM store_integration WHERE provider=$1 RETURNING provider",
    [provider]
  )
  if (!removed.length)
    return NextResponse.json({ error: "Entegrasyon bulunamadı." }, { status: 404 })
  return NextResponse.json({ success: true, message: "Entegrasyon kalıcı olarak silindi." })
}
