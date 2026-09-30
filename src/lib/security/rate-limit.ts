import "server-only"

import { query } from "@lib/admin/db"

let tablePromise: Promise<unknown> | null = null

function ensureTable() {
  if (process.env.NODE_ENV === "production") return Promise.resolve()
  if (!tablePromise) {
    tablePromise = query(`
      CREATE TABLE IF NOT EXISTS api_rate_limits (
        key TEXT PRIMARY KEY,
        request_count INTEGER NOT NULL DEFAULT 0,
        reset_at TIMESTAMPTZ NOT NULL
      )
    `).catch((error) => {
      tablePromise = null
      throw error
    })
  }
  return tablePromise
}

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  options: { failClosed?: boolean } = {}
) {
  try {
    await ensureTable()
    const rows = await query<{ request_count: number; reset_at: string }>(
      `INSERT INTO api_rate_limits (key, request_count, reset_at)
       VALUES ($1, 1, NOW() + ($2 * INTERVAL '1 second'))
       ON CONFLICT (key) DO UPDATE SET
         request_count = CASE
           WHEN api_rate_limits.reset_at <= NOW() THEN 1
           ELSE api_rate_limits.request_count + 1
         END,
         reset_at = CASE
           WHEN api_rate_limits.reset_at <= NOW()
             THEN NOW() + ($2 * INTERVAL '1 second')
           ELSE api_rate_limits.reset_at
         END
       RETURNING request_count, reset_at`,
      [key, windowSeconds]
    )
    const row = rows[0]
    if (!row) throw new Error("Rate limit storage unavailable")
    return {
      allowed: Number(row?.request_count || 0) <= limit,
      remaining: Math.max(0, limit - Number(row?.request_count || 0)),
      resetAt: row?.reset_at,
      unavailable: false,
    }
  } catch (error) {
    return {
      allowed: !options.failClosed,
      remaining: options.failClosed ? 0 : limit,
      resetAt: new Date().toISOString(),
      unavailable: true,
    }
  }
}
