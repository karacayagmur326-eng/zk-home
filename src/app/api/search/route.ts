import { NextRequest, NextResponse } from "next/server"
import { listStoreProducts } from "@lib/commerce/repository"
import { formatTryPrice } from "@lib/util/money"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(`search:${requestIp(req)}`, 120, 60)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Çok fazla arama yapıldı." }, { status: 429 })
  }
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim().slice(0, 100) || ""

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], total: 0 })
  }

  try {
    const { products, count } = await listStoreProducts({
      q,
      status: "published",
      limit: 8,
    })

    const shaped = products.map((p: any) => {
      const variant = p.variants?.[0]
      const rawPrice =
        variant?.calculated_price?.calculated_amount ??
        variant?.prices?.[0]?.amount ??
        0

      const priceInTL = rawPrice / 100

      const formattedPrice = formatTryPrice(priceInTL)

      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail || variant?.thumbnail || "/images/placeholder.svg",
        price: priceInTL,
        formatted_price: formattedPrice,
        category: p.categories?.[0]?.name || null,
      }
    })

    return NextResponse.json({ products: shaped, total: count })
  } catch (err: any) {
    console.error("Search API error:", err)
    return NextResponse.json({ error: "Arama şu anda tamamlanamadı." }, { status: 500 })
  }
}
