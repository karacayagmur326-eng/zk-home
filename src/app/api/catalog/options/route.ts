import { NextResponse } from "next/server"

export const revalidate = 86400

export async function GET() {
  return NextResponse.json(
    { product_options: [] },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  )
}
