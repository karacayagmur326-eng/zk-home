import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import {
  createAiProvider,
  defaultModel,
  deleteAiProvider,
  isAiProvider,
  isResetPeriod,
  listAiProviders,
  updateAiProvider,
} from "@lib/chatbot/providers"

function parseTokenLimit(value: unknown) {
  if (value === null || value === "" || value === undefined) return null
  const parsed = Math.floor(Number(value))
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10_000_000_000) throw new Error("Token limiti geçersiz.")
  return parsed
}

function cleanModel(value: unknown, fallback: string) {
  const model = String(value || fallback).trim().slice(0, 120)
  if (!/^[a-z0-9._:-]+$/i.test(model)) throw new Error("Model adı geçersiz.")
  return model
}

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  return NextResponse.json({ providers: await listAiProviders() })
}

export async function POST(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const body = await request.json()
    if (!isAiProvider(body?.provider)) return NextResponse.json({ error: "Desteklenmeyen AI sağlayıcısı." }, { status: 400 })
    const apiKey = String(body?.api_key || "").trim()
    if (apiKey.length < 12) return NextResponse.json({ error: "Geçerli bir API anahtarı girin." }, { status: 400 })
    const resetPeriod = isResetPeriod(body?.reset_period) ? body.reset_period : "monthly"
    const provider = await createAiProvider({
      provider: body.provider,
      name: String(body?.name || `${body.provider} bağlantısı`).trim().slice(0, 80),
      model: cleanModel(body?.model, defaultModel(body.provider)),
      api_key: apiKey,
      enabled: body?.enabled !== false,
      priority: Math.min(Math.max(Math.floor(Number(body?.priority || 100)), 1), 999),
      token_limit: parseTokenLimit(body?.token_limit),
      reset_period: resetPeriod,
    })
    return NextResponse.json({ ok: true, provider, providers: await listAiProviders() })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI bağlantısı eklenemedi." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const body = await request.json()
    const id = String(body?.id || "")
    if (!id) return NextResponse.json({ error: "Bağlantı kimliği eksik." }, { status: 400 })
    const patch: any = {
      name: body.name === undefined ? undefined : String(body.name).trim().slice(0, 80),
      model: body.model === undefined ? undefined : cleanModel(body.model, ""),
      api_key: body.api_key === undefined || body.api_key === "" ? undefined : String(body.api_key).trim(),
      enabled: body.enabled === undefined ? undefined : body.enabled === true,
      priority: body.priority === undefined ? undefined : Math.min(Math.max(Math.floor(Number(body.priority)), 1), 999),
      token_limit: body.token_limit === undefined ? undefined : parseTokenLimit(body.token_limit),
      reset_period: body.reset_period === undefined ? undefined : (isResetPeriod(body.reset_period) ? body.reset_period : undefined),
      reset_usage: body.reset_usage === true,
    }
    const provider = await updateAiProvider(id, patch)
    if (!provider) return NextResponse.json({ error: "AI bağlantısı bulunamadı." }, { status: 404 })
    return NextResponse.json({ ok: true, provider, providers: await listAiProviders() })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI bağlantısı güncellenemedi." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const id = new URL(request.url).searchParams.get("id") || ""
  if (!id) return NextResponse.json({ error: "Bağlantı kimliği eksik." }, { status: 400 })
  const deleted = await deleteAiProvider(id)
  if (!deleted) return NextResponse.json({ error: "AI bağlantısı bulunamadı." }, { status: 404 })
  return NextResponse.json({ ok: true, providers: await listAiProviders() })
}
