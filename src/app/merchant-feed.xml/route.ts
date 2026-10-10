import { NextResponse } from "next/server"
import { listStoreProducts } from "@lib/commerce/repository"
import { getThemeSettings } from "@lib/content/theme-settings"
import { absoluteUrl, plainText } from "@lib/seo/entity"
import { escapeXml } from "@lib/seo/indexing"
import { validGtin } from "@lib/seo/gtin"
import { getCommerceSettings } from "@lib/commerce/settings"
import { rangeShippingAmount } from "@lib/commerce/shipping"

export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const products: any[] = []
    for (let offset = 0; ; offset += 500) {
      const catalog = await listStoreProducts({
        status: "published",
        limit: 500,
        offset,
      })
      products.push(...catalog.products)
      if (
        offset + catalog.products.length >= catalog.count ||
        !catalog.products.length
      )
        break
    }
    const [settings, commerce] = await Promise.all([
      getThemeSettings(),
      getCommerceSettings(),
    ])
    const tag = (name: string, value: unknown) =>
      value !== undefined && value !== null && value !== ""
        ? `<g:${name}>${escapeXml(String(value))}</g:${name}>`
        : ""
    const rows = products
      .filter((product) => product.metadata?.merchant_excluded !== true)
      .flatMap((product) => {
        const md = product.metadata || {}
        return product.variants
          .filter(
            (variant: any) =>
              Number(variant.prices?.[0]?.amount) > 0 &&
              (variant.thumbnail ||
                product.thumbnail ||
                product.images?.[0]?.url)
          )
          .map((variant: any) => {
            const price = Number(variant.prices[0].amount),
              original = Number(
                variant.calculated_price?.original_amount || price
              )
            const currency = String(
              variant.prices[0].currency_code || "try"
            ).toUpperCase()
            const formatPrice = (amount: number) =>
              `${(amount / 100).toFixed(2)} ${currency}`
            const shippingFee = commerce.shipping_ranges
              ? rangeShippingAmount(price, commerce.shipping_ranges)
              : undefined
            const shipping =
              shippingFee !== undefined
                ? `<g:shipping>${tag("country", "TR")}${tag(
                    "price",
                    formatPrice(shippingFee)
                  )}</g:shipping>`
                : ""
            const gtin = String(
              variant.barcode || md.gtin || md.barcode || ""
            ).trim()
            const brand = md.brand_name || product.collection?.title || md.brand
            const mpn = variant.metadata?.mpn || md.mpn
            const image = absoluteUrl(
              variant.thumbnail || product.thumbnail || product.images[0].url
            )
            const stock =
              !variant.manage_inventory ||
              Number(variant.inventory_quantity) > 0
                ? "in_stock"
                : variant.allow_backorder && variant.metadata?.availability_date
                ? "backorder"
                : "out_of_stock"
            return `<item>${tag("id", variant.id)}${tag(
              "item_group_id",
              product.id
            )}${tag(
              "title",
              product.variants.length > 1
                ? `${product.title} — ${variant.title}`
                : product.title
            )}${tag(
              "description",
              plainText(product.description || md.product_summary)
            )}${tag(
              "link",
              absoluteUrl(
                `/urunler/${product.handle}${
                  product.variants.length > 1
                    ? `?v_id=${encodeURIComponent(variant.id)}`
                    : ""
                }`
              )
            )}${tag("image_link", image)}${(product.images || [])
              .filter((entry: any) => absoluteUrl(entry.url) !== image)
              .slice(0, 10)
              .map((entry: any) =>
                tag("additional_image_link", absoluteUrl(entry.url))
              )
              .join("")}${tag(
              "price",
              formatPrice(original > price ? original : price)
            )}${
              original > price ? tag("sale_price", formatPrice(price)) : ""
            }${tag("availability", stock)}${
              stock === "backorder"
                ? tag("availability_date", variant.metadata.availability_date)
                : ""
            }${tag("condition", "new")}${tag("brand", brand)}${
              validGtin(gtin) ? tag("gtin", gtin) : ""
            }${tag("mpn", mpn)}${tag(
              "color",
              variant.metadata?.color || variant.metadata?.renk
            )}${tag(
              "size",
              variant.metadata?.size || variant.metadata?.beden
            )}${tag(
              "product_type",
              product.categories
                .map((category: any) => category.name)
                .join(" > ")
            )}${tag(
              "google_product_category",
              md.google_product_category
            )}${shipping}</item>`
          })
      })
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${escapeXml(
        settings?.logo_text || "ZK Home"
      )}</title><link>${escapeXml(
        absoluteUrl("/")
      )}</link><description>Güncel ürün fiyatları ve stok durumu</description>${rows.join(
        "\n"
      )}</channel></rss>`,
      {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control":
            "public, max-age=60, s-maxage=60, stale-while-revalidate=60",
        },
      }
    )
  } catch {
    return new NextResponse("Ürün verileri geçici olarak alınamadı", {
      status: 503,
      headers: { "Retry-After": "300", "Cache-Control": "no-store" },
    })
  }
}
