import { rangeShippingAmount } from "@lib/commerce/shipping"
import { validGtin } from "./gtin"
import { absoluteUrl, plainText } from "./entity"

export function productStructuredData(
  product: any,
  settings: any = {},
  reviews: any[] = [],
  selectedVariantId?: string
) {
  const md = product.metadata || {}
  const baseUrl = absoluteUrl(`/urunler/${product.handle}`)
  const brand = md.brand_name || product.collection?.title || md.brand
  const images = (
    product.images?.length
      ? product.images.map((image: any) => absoluteUrl(image.url))
      : [absoluteUrl(product.thumbnail)]
  ).filter(Boolean)
  const description = plainText(md.product_summary || product.description)
  const variants = product.variants || []
  const variantProduct = (variant: any) => {
    const price =
      Number(
        variant.calculated_price?.calculated_amount ??
          variant.prices?.[0]?.amount ??
          0
      ) / 100
    const gtin = String(variant.barcode || md.gtin || md.barcode || "").trim()
    const options = { ...variant.metadata }
    for (const option of variant.options || [])
      options[
        String(option.option?.title || option.title || "").toLowerCase()
      ] = option.value
    const available =
      !variant.manage_inventory ||
      variant.allow_backorder ||
      Number(variant.inventory_quantity) > 0
    const shippingFee = settings.commerce?.shipping_ranges
      ? rangeShippingAmount(
          Math.round(price * 100),
          settings.commerce.shipping_ranges
        )
      : undefined
    const shipping =
      md.shipping_schema ||
      (shippingFee !== undefined
        ? {
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "TR",
            },
            shippingRate: {
              "@type": "MonetaryAmount",
              value: shippingFee / 100,
              currency: "TRY",
            },
          }
        : undefined)
    const returns = md.return_policy_schema || {
      applicableCountry: "TR",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
      merchantReturnLink: absoluteUrl("/teslimat-ve-iade"),
    }
    return {
      "@type": "Product",
      "@id": `${baseUrl}#${variant.id}`,
      name:
        variants.length > 1
          ? `${product.title} — ${variant.title}`
          : product.title,
      description,
      url:
        variants.length > 1
          ? `${baseUrl}?v_id=${encodeURIComponent(variant.id)}`
          : baseUrl,
      image: variant.thumbnail
        ? [absoluteUrl(variant.thumbnail), ...images]
        : images,
      ...(variant.sku ? { sku: variant.sku } : {}),
      ...(md.model ? { model: md.model } : {}),
      ...(md.mpn || options.mpn ? { mpn: options.mpn || md.mpn } : {}),
      ...(validGtin(gtin) ? { [`gtin${gtin.length}`]: gtin } : {}),
      ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
      ...(options.color || options.renk
        ? { color: options.color || options.renk }
        : {}),
      ...(options.size || options.beden || options.ölçü
        ? { size: options.size || options.beden || options.ölçü }
        : {}),
      ...(price > 0
        ? {
            offers: {
              "@type": "Offer",
              price: price.toFixed(2),
              priceCurrency: String(
                variant.calculated_price?.currency_code ||
                  variant.prices?.[0]?.currency_code ||
                  "TRY"
              ).toUpperCase(),
              url:
                variants.length > 1
                  ? `${baseUrl}?v_id=${encodeURIComponent(variant.id)}`
                  : baseUrl,
              itemCondition: "https://schema.org/NewCondition",
              availability: available
                ? variant.allow_backorder &&
                  Number(variant.inventory_quantity) <= 0
                  ? "https://schema.org/BackOrder"
                  : "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: settings.logo_text || "ZK Home",
                url: absoluteUrl("/"),
              },
              ...(shipping?.shippingDestination && shipping?.shippingRate
                ? {
                    shippingDetails: {
                      ...shipping,
                      "@type": "OfferShippingDetails",
                    },
                  }
                : {}),
              ...(returns?.applicableCountry && returns?.returnPolicyCategory
                ? {
                    hasMerchantReturnPolicy: {
                      ...returns,
                      "@type": "MerchantReturnPolicy",
                    },
                  }
                : {}),
            },
          }
        : {}),
    }
  }
  const validReviews = reviews.filter(
    (review) =>
      Number(review.rating) >= 1 &&
      Number(review.rating) <= 5 &&
      review.author?.trim() &&
      review.comment?.trim()
  )
  const rating = validReviews.length
    ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(
            (
              validReviews.reduce(
                (sum, review) => sum + Number(review.rating),
                0
              ) / validReviews.length
            ).toFixed(2)
          ),
          reviewCount: validReviews.length,
        },
        review: validReviews
          .slice(0, 10)
          .map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.author },
            reviewRating: {
              "@type": "Rating",
              ratingValue: Number(review.rating),
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: review.comment,
            ...(review.created_at
              ? {
                  datePublished: new Date(review.created_at)
                    .toISOString()
                    .slice(0, 10),
                }
              : {}),
          })),
      }
    : {}
  if (variants.length > 1)
    return {
      "@context": "https://schema.org",
      "@type": "ProductGroup",
      "@id": `${baseUrl}#group`,
      productGroupID: product.id,
      name: product.title,
      description,
      image: images,
      url: baseUrl,
      ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
      ...rating,
      hasVariant: variants.map(variantProduct),
      variesBy: Array.from(
        new Set(
          variants.flatMap((variant: any) => {
            const data = variantProduct(variant)
            return [
              ...("color" in data ? ["https://schema.org/color"] : []),
              ...("size" in data ? ["https://schema.org/size"] : []),
            ]
          })
        )
      ),
    }
  return {
    "@context": "https://schema.org",
    ...variantProduct(
      variants.find((variant: any) => variant.id === selectedVariantId) ||
        variants[0] ||
        {}
    ),
    ...rating,
  }
}
