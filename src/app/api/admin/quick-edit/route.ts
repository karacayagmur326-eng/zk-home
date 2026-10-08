import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { resolveAdminEditTarget } from "@lib/admin/quick-edit"

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" }
  if (!(await getAdminSession())) return NextResponse.json({ href: null }, { status: 401, headers })
  try {
    const target = await resolveAdminEditTarget(request.nextUrl.searchParams.get("path") || "/")
    return NextResponse.json(target || { href: null }, { headers })
  } catch {
    return NextResponse.json({ href: null }, { status: 500, headers })
  }
}
