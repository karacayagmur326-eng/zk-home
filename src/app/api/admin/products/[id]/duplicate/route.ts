import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import {
  createStoreProduct,
  getStoreProduct,
} from "@lib/commerce/repository"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const source = await getStoreProduct((await params).id)
  if (!source)
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })

  const product = await createStoreProduct({
    ...source,
    id: undefined,
    title: `(Kopya) ${source.title}`,
    handle: `${source.handle}-kopya-${Date.now()}`,
    status: "draft",
    images: source.images,
    categories: source.categories,
    tags: source.tags,
    variants: (source.variants || []).map((variant: any) => ({
      ...variant,
      id: undefined,
      sku: variant.sku ? `${variant.sku}-KOPYA-${Date.now()}` : undefined,
      prices: variant.prices,
    })),
  })
  return NextResponse.json({ product }, { status: 201 })
}
