import { NextResponse } from "next/server"
import { listProductsWithSort } from "@lib/data/products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"

export async function GET(request: Request) {
  try {
    const rate = await checkRateLimit(`products-page:${requestIp(request)}`, 180, 60)
    if (!rate.allowed) {
      return NextResponse.json({ error: "Çok fazla ürün isteği yapıldı." }, { status: 429 })
    }
    const { searchParams } = new URL(request.url)
    const page = Math.min(10_000, Math.max(1, Number(searchParams.get("page") || 1) || 1))
    const sortBy = (searchParams.get("sortBy") || "created_at") as SortOptions
    const countryCode = searchParams.get("countryCode") || "tr"
    const collectionId = searchParams.get("collectionId") || undefined
    const categoryId = searchParams.get("categoryId") || undefined
    const searchQuery = searchParams.get("searchQuery")?.slice(0, 100) || undefined
    const hideOutOfStock = searchParams.get("hideOutOfStock") || undefined
    const priceMin = searchParams.get("priceMin") || undefined
    const priceMax = searchParams.get("priceMax") || undefined

    const queryParams: any = { limit: 12 }
    if (collectionId) queryParams.collection_id = [collectionId]
    if (categoryId) queryParams.category_id = [categoryId]
    if (searchQuery?.trim()) queryParams.q = searchQuery.trim()
    if (hideOutOfStock) queryParams.hide_out_of_stock = hideOutOfStock
    if (priceMin) queryParams.price_min = priceMin
    if (priceMax) queryParams.price_max = priceMax

    const {
      response: { products, count },
    } = await listProductsWithSort({
      page,
      queryParams,
      sortBy,
      countryCode,
    })

    const totalPages = Math.ceil(count / 12)

    return NextResponse.json({
      products: products || [],
      count: count || 0,
      totalPages,
      page,
      hasMore: page < totalPages,
    })
  } catch (err: any) {
    console.error("Paginated products API error:", err)
    return NextResponse.json({ error: "Ürünler şu anda yüklenemedi." }, { status: 500 })
  }
}
