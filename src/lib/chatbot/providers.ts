import "server-only"

import { randomUUID } from "crypto"
import { query } from "@lib/admin/db"
import { decryptSettings, encryptSettings } from "@lib/security/encrypted-settings"

export type AiProviderKind = "gemini" | "openai" | "anthropic"
export type AiResetPeriod = "daily" | "monthly" | "never"

export type AiProviderRecord = {
  id: string
  provider: AiProviderKind
  name: string
  model: string
  enabled: boolean
  priority: number
  token_limit: number | null
  reset_period: AiResetPeriod
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  request_count: number
  error_count: number
  period_started_at: string
  period_ends_at: string | null
  last_used_at: string | null
  last_tested_at: string | null
  last_status: "untested" | "healthy" | "error"
  last_error: string
  key_hint: string
  created_at: string
  updated_at: string
}

export type AiProviderSecret = AiProviderRecord & { api_key: string }

const PROVIDERS: AiProviderKind[] = ["gemini", "openai", "anthropic"]
const RESET_PERIODS: AiResetPeriod[] = ["daily", "monthly", "never"]

export function isAiProvider(value: unknown): value is AiProviderKind {
  return PROVIDERS.includes(String(value) as AiProviderKind)
}

export function isResetPeriod(value: unknown): value is AiResetPeriod {
  return RESET_PERIODS.includes(String(value) as AiResetPeriod)
}

export function defaultModel(provider: AiProviderKind) {
  if (provider === "openai") return "gpt-5-mini"
  if (provider === "anthropic") return "claude-sonnet-4-6"
  return "gemini-2.5-flash-lite"
}

function nextReset(period: AiResetPeriod, from = new Date()) {
  if (period === "never") return null
  if (period === "daily") return new Date(from.getTime() + 24 * 60 * 60 * 1000)
  const next = new Date(from)
  next.setUTCMonth(next.getUTCMonth() + 1)
  return next
}

function keyHint(apiKey: string) {
  const value = apiKey.trim()
  return value.length <= 6 ? "••••••" : `••••••••${value.slice(-4)}`
}

let schemaReady: Promise<void> | null = null

async function prepareAiProviderSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS chatbot_ai_providers (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL CHECK (provider IN ('gemini','openai','anthropic')),
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      encrypted_api_key TEXT NOT NULL,
      key_hint TEXT NOT NULL DEFAULT '',
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      priority INTEGER NOT NULL DEFAULT 100,
      token_limit BIGINT,
      reset_period TEXT NOT NULL DEFAULT 'monthly' CHECK (reset_period IN ('daily','monthly','never')),
      period_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      period_ends_at TIMESTAMPTZ,
      prompt_tokens BIGINT NOT NULL DEFAULT 0,
      completion_tokens BIGINT NOT NULL DEFAULT 0,
      total_tokens BIGINT NOT NULL DEFAULT 0,
      request_count BIGINT NOT NULL DEFAULT 0,
      error_count BIGINT NOT NULL DEFAULT 0,
      last_used_at TIMESTAMPTZ,
      last_tested_at TIMESTAMPTZ,
      last_status TEXT NOT NULL DEFAULT 'untested',
      last_error TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(`CREATE INDEX IF NOT EXISTS idx_chatbot_ai_providers_active ON chatbot_ai_providers(enabled, priority, created_at)`)

  const existing = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM chatbot_ai_providers`)
  if (Number(existing[0]?.count || 0) > 0) return

  const legacyRows = await query<{ value: unknown }>(`SELECT value FROM store_settings WHERE key='chatbot_ai_secret' LIMIT 1`)
  const raw = legacyRows[0]?.value
  const legacy = decryptSettings(typeof raw === "string" ? raw : "")
  const apiKey = String(legacy.api_key || process.env.GEMINI_API_KEY || "").trim()
  if (!apiKey) return
  await createAiProvider({
    provider: "gemini",
    name: legacy.api_key ? "Gemini (önceki kayıt)" : "Gemini (ortam anahtarı kopyası)",
    model: "gemini-2.5-flash-lite",
    api_key: apiKey,
    enabled: true,
    priority: 10,
    token_limit: null,
    reset_period: "monthly",
  }, false)
}

export async function ensureAiProviderSchema() {
  if (!schemaReady) {
    schemaReady = prepareAiProviderSchema().catch((error) => {
      schemaReady = null
      throw error
    })
  }
  return schemaReady
}

function serialize(row: any): AiProviderRecord {
  return {
    ...row,
    priority: Number(row.priority || 100),
    token_limit: row.token_limit === null ? null : Number(row.token_limit),
    prompt_tokens: Number(row.prompt_tokens || 0),
    completion_tokens: Number(row.completion_tokens || 0),
    total_tokens: Number(row.total_tokens || 0),
    request_count: Number(row.request_count || 0),
    error_count: Number(row.error_count || 0),
  }
}

export async function listAiProviders() {
  await ensureAiProviderSchema()
  await query(`
    UPDATE chatbot_ai_providers SET
      period_started_at=NOW(),
      period_ends_at=CASE reset_period WHEN 'daily' THEN NOW()+INTERVAL '1 day' WHEN 'monthly' THEN NOW()+INTERVAL '1 month' ELSE NULL END,
      prompt_tokens=0, completion_tokens=0, total_tokens=0, request_count=0, error_count=0,
      updated_at=NOW()
    WHERE period_ends_at IS NOT NULL AND period_ends_at <= NOW()
  `)
  const rows = await query<any>(`
    SELECT id,provider,name,model,enabled,priority,token_limit,reset_period,prompt_tokens,
      completion_tokens,total_tokens,request_count,error_count,period_started_at,period_ends_at,
      last_used_at,last_tested_at,last_status,last_error,key_hint,created_at,updated_at
    FROM chatbot_ai_providers ORDER BY priority ASC, created_at ASC
  `)
  return rows.map(serialize)
}

export async function listActiveAiProviderSecrets() {
  await ensureAiProviderSchema()
  await query(`
    UPDATE chatbot_ai_providers SET
      period_started_at=NOW(),
      period_ends_at=CASE reset_period WHEN 'daily' THEN NOW()+INTERVAL '1 day' WHEN 'monthly' THEN NOW()+INTERVAL '1 month' ELSE NULL END,
      prompt_tokens=0, completion_tokens=0, total_tokens=0, request_count=0, error_count=0, updated_at=NOW()
    WHERE period_ends_at IS NOT NULL AND period_ends_at <= NOW()
  `)
  const rows = await query<any>(`
    SELECT * FROM chatbot_ai_providers
    WHERE enabled=TRUE AND (token_limit IS NULL OR total_tokens < token_limit)
    ORDER BY priority ASC, created_at ASC
  `)
  return rows.map((row) => ({
    ...serialize(row),
    api_key: String(decryptSettings(row.encrypted_api_key).api_key || ""),
  })).filter((row) => row.api_key) as AiProviderSecret[]
}

export async function getAiProviderSecret(id: string) {
  await ensureAiProviderSchema()
  const rows = await query<any>(`SELECT * FROM chatbot_ai_providers WHERE id=$1 LIMIT 1`, [id])
  if (!rows[0]) return null
  return { ...serialize(rows[0]), api_key: String(decryptSettings(rows[0].encrypted_api_key).api_key || "") } as AiProviderSecret
}

export async function createAiProvider(input: {
  provider: AiProviderKind
  name: string
  model: string
  api_key: string
  enabled: boolean
  priority: number
  token_limit: number | null
  reset_period: AiResetPeriod
}, ensure = true) {
  if (ensure) await ensureAiProviderSchema()
  const now = new Date()
  const id = randomUUID()
  const rows = await query<any>(`
    INSERT INTO chatbot_ai_providers
      (id,provider,name,model,encrypted_api_key,key_hint,enabled,priority,token_limit,reset_period,period_started_at,period_ends_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
  `, [id, input.provider, input.name, input.model, encryptSettings({ api_key: input.api_key }), keyHint(input.api_key),
    input.enabled, input.priority, input.token_limit, input.reset_period, now, nextReset(input.reset_period, now)])
  return serialize(rows[0])
}

export async function updateAiProvider(id: string, input: Partial<{
  provider: AiProviderKind
  name: string
  model: string
  api_key: string
  enabled: boolean
  priority: number
  token_limit: number | null
  reset_period: AiResetPeriod
  reset_usage: boolean
}>) {
  await ensureAiProviderSchema()
  const current = await getAiProviderSecret(id)
  if (!current) return null
  const period = input.reset_period || current.reset_period
  const reset = input.reset_usage === true || period !== current.reset_period
  const apiKey = String(input.api_key || current.api_key).trim()
  const rows = await query<any>(`
    UPDATE chatbot_ai_providers SET
      provider=$2,name=$3,model=$4,encrypted_api_key=$5,key_hint=$6,enabled=$7,priority=$8,token_limit=$9,reset_period=$10,
      period_started_at=CASE WHEN $11 THEN NOW() ELSE period_started_at END,
      period_ends_at=CASE WHEN $11 THEN CASE $10 WHEN 'daily' THEN NOW()+INTERVAL '1 day' WHEN 'monthly' THEN NOW()+INTERVAL '1 month' ELSE NULL END ELSE period_ends_at END,
      prompt_tokens=CASE WHEN $11 THEN 0 ELSE prompt_tokens END,
      completion_tokens=CASE WHEN $11 THEN 0 ELSE completion_tokens END,
      total_tokens=CASE WHEN $11 THEN 0 ELSE total_tokens END,
      request_count=CASE WHEN $11 THEN 0 ELSE request_count END,
      error_count=CASE WHEN $11 THEN 0 ELSE error_count END,
      updated_at=NOW()
    WHERE id=$1 RETURNING *
  `, [id, input.provider || current.provider, String(input.name || current.name), String(input.model || current.model),
    encryptSettings({ api_key: apiKey }), keyHint(apiKey), input.enabled ?? current.enabled, input.priority ?? current.priority,
    input.token_limit === undefined ? current.token_limit : input.token_limit, period, reset])
  return rows[0] ? serialize(rows[0]) : null
}

export async function deleteAiProvider(id: string) {
  await ensureAiProviderSchema()
  const rows = await query<{ id: string }>(`DELETE FROM chatbot_ai_providers WHERE id=$1 RETURNING id`, [id])
  return Boolean(rows[0])
}

export async function recordAiUsage(id: string, usage: { prompt: number; completion: number; total: number }) {
  await query(`
    UPDATE chatbot_ai_providers SET
      prompt_tokens=prompt_tokens+$2, completion_tokens=completion_tokens+$3, total_tokens=total_tokens+$4,
      request_count=request_count+1,last_used_at=NOW(),last_status='healthy',last_error='',updated_at=NOW()
    WHERE id=$1
  `, [id, Math.max(0, usage.prompt), Math.max(0, usage.completion), Math.max(0, usage.total)])
}

export async function recordAiError(id: string, message: string, tested = false) {
  await query(`UPDATE chatbot_ai_providers SET error_count=error_count+1,last_status='error',last_error=$2,${tested ? "last_tested_at=NOW()," : ""}updated_at=NOW() WHERE id=$1`, [id, message.slice(0, 300)])
}

export async function recordAiTestSuccess(id: string) {
  await query(`UPDATE chatbot_ai_providers SET last_tested_at=NOW(),last_status='healthy',last_error='',updated_at=NOW() WHERE id=$1`, [id])
}
