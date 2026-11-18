import { NextResponse } from "next/server"
import { listActiveSliders } from "@lib/data/sliders"

export const revalidate = 300

export async function GET() {
  return NextResponse.json({ sliders: await listActiveSliders() }, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=60" },
  })
}
