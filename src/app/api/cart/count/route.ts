import { NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET() {
  try {
    const cart = await retrieveCart().catch(() => null)
    const count =
      cart?.items?.reduce(
        (acc: number, item: any) => acc + (item.quantity || 1),
        0
      ) || 0
    return NextResponse.json({ count }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    return NextResponse.json({ count: 0 }, { headers: NO_CACHE_HEADERS })
  }
}
