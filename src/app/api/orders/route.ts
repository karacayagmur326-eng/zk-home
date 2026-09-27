import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { validateBirFaturaToken } from "@lib/birfatura/auth"
import { BirFaturaOrdersRequestSchema } from "@lib/birfatura/schemas"
import { getBirFaturaOrdersList } from "@lib/birfatura/service"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** BirFatura pulls orders; HTTP 200 must contain contract-compatible Orders. */
async function listOrders(req: NextRequest) {
  const requestId = randomUUID()
  const started = Date.now()
  const respond = (body: unknown, status: number) => NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-BirFatura-Request-Id": requestId },
  })
  // warn survives production removeConsole. Only allowlisted operational fields:
  // no raw body, URL/query string, auth headers, customer information or API keys.
  const audit = (event: string, fields: Record<string, unknown> = {}) => {
    console.warn(JSON.stringify({ event, requestId, method: req.method, ...fields }))
  }
  try {
    const authError = await validateBirFaturaToken(req)
    if (authError) {
      audit("birfatura.orders.unauthorized", { status: authError.status })
      return authError
    }

    let rawBody: Record<string, unknown> = {}
    if (req.method === "POST") {
      const text = await req.text()
      try {
        const value: unknown = text.trim() ? JSON.parse(text) : {}
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_BODY")
        rawBody = value as Record<string, unknown>
      } catch {
        audit("birfatura.orders.invalid_json")
        return respond({ error: "Geçerli bir JSON nesnesi gönderilmelidir.", requestId }, 400)
      }
    }
    for (const key of ["orderStatusId", "startDateTime", "endDateTime"]) {
      if (rawBody[key] === undefined && req.nextUrl.searchParams.has(key)) {
        rawBody[key] = req.nextUrl.searchParams.get(key)
      }
    }
    const parsed = BirFaturaOrdersRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      audit("birfatura.orders.invalid_filters")
      return respond({ error: "Geçersiz durum veya tarih aralığı.", requestId }, 400)
    }

    const orders = await getBirFaturaOrdersList(parsed.data)
    audit("birfatura.orders.success", {
      ...parsed.data, orderCount: orders.length, durationMs: Date.now() - started,
    })
    return respond({ Orders: orders }, 200)
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "INTERNAL_ERROR"
    audit("birfatura.orders.failed", { code, durationMs: Date.now() - started })
    return respond({ error: "Siparişler alınamadı.", requestId }, 500)
  }
}

export const POST = listOrders
export const GET = listOrders
