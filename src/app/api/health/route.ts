import { NextResponse } from "next/server"
import { isDatabaseReachable, query } from "@lib/admin/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const database = await isDatabaseReachable()
  const schema = database && await query<{ ready: boolean }>(
    "SELECT to_regclass('public.store_category') IS NOT NULL AND to_regclass('public.store_product') IS NOT NULL AND to_regclass('public.theme_settings') IS NOT NULL AND to_regclass('public.api_rate_limits') IS NOT NULL AS ready",
  ).then((rows) => rows[0]?.ready === true).catch(() => false)
  const ready = database && schema
  return NextResponse.json(
    { status: ready ? "ok" : "degraded", checks: { database, schema }, timestamp: new Date().toISOString() },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  )
}
