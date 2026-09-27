import { NextResponse } from "next/server"
import { listActiveSliders } from "@lib/data/sliders"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ sliders: await listActiveSliders() })
}
