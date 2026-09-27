import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale, parseTryPriceInput } from "./money"

type VariantWithPrice = HttpTypes.StoreProductVariant & {
  calculated_price?: {
    calculated_amount: number
    original_amount: number
    currency_code: string
    calculated_price: {
      price_list_type: string
    }
  }
}

export const getPricesForVariant = (
  variant: VariantWithPrice & { prices?: any[] },
) => {
  if (!variant) return null
  if (
    !variant.calculated_price?.calculated_amount &&
    (!variant.prices || variant.prices.length === 0)
  ) {
    return null
  }

  if (variant.calculated_price && variant.calculated_price.calculated_amount) {
    return {
      calculated_price_number: variant.calculated_price.calculated_amount,
      calculated_price: convertToLocale({
        amount: variant.calculated_price.calculated_amount,
        currency_code: variant.calculated_price.currency_code,
      }),
      original_price_number: variant.calculated_price.original_amount,
      original_price: convertToLocale({
        amount: variant.calculated_price.original_amount,
        currency_code: variant.calculated_price.currency_code,
      }),
      currency_code: variant.calculated_price.currency_code,
      price_type:
        variant.calculated_price.calculated_price?.price_list_type || "default",
      percentage_diff: getPercentageDiff(
        variant.calculated_price.original_amount,
        variant.calculated_price.calculated_amount,
      ),
    }
  } else if (variant.prices && variant.prices.length > 0) {
    const price = variant.prices[0]
    return {
      calculated_price_number: price.amount,
      calculated_price: convertToLocale({
        amount: price.amount,
        currency_code: price.currency_code || "try",
      }),
      original_price_number: price.amount,
      original_price: convertToLocale({
        amount: price.amount,
        currency_code: price.currency_code || "try",
      }),
      currency_code: price.currency_code || "try",
      price_type: "default",
      percentage_diff: "0",
    }
  }

  return null
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("Ürün bilgisi bulunamadı.")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const cheapestVariant = (product.variants as any[])
      .filter(
        (v) =>
          !!v.calculated_price?.calculated_amount ||
          (v.prices && v.prices.length > 0),
      )
      .sort((a, b) => {
        const aAmount =
          a.calculated_price?.calculated_amount ?? a.prices?.[0]?.amount ?? 0
        const bAmount =
          b.calculated_price?.calculated_amount ?? b.prices?.[0]?.amount ?? 0
        return aAmount - bAmount
      })[0]

    return getPricesForVariant(cheapestVariant)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId,
    ) as VariantWithPrice | undefined

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  const applyMetadataDiscount = (priceObj: any) => {
    if (!priceObj) return null

    // Commerce katmanındaki fiyatlar daima kuruş olarak saklanır.
    const rawCalc = priceObj.calculated_price_number || 0
    const calcTL = rawCalc / 100
    const calcCents = Math.round(rawCalc)

    // 1. Check if Medusa native calculated_price has original_amount > calculated_amount
    if (
      priceObj.original_price_number &&
      priceObj.calculated_price_number
    ) {
      const rawOrig = priceObj.original_price_number
      const origTL = rawOrig / 100
      const origCents = Math.round(rawOrig)

      if (origTL > calcTL && calcTL > 0) {
        return {
          ...priceObj,
          original_price_number: origTL,
          calculated_price_number: calcTL,
          original_price: convertToLocale({
            amount: origCents,
            currency_code: priceObj.currency_code || "TRY",
          }),
          calculated_price: convertToLocale({
            amount: calcCents,
            currency_code: priceObj.currency_code || "TRY",
          }),
          price_type: "sale",
          percentage_diff: getPercentageDiff(origTL, calcTL),
        }
      }
    }

    // 2. Check metadata for custom original_price / normal_price / compare_price / regular_price
    const rawMeta =
      product.metadata?.original_price ??
      product.metadata?.normal_price ??
      product.metadata?.compare_price ??
      product.metadata?.regular_price

    if (rawMeta != null && rawMeta !== "") {
      const parsedOriginal = parseTryPriceInput(rawMeta as string | number) / 100

      if (!isNaN(parsedOriginal) && parsedOriginal > 0) {
        if (parsedOriginal > calcTL && calcTL > 0) {
          const origCents = Math.round(parsedOriginal * 100)
          return {
            ...priceObj,
            original_price_number: parsedOriginal,
            calculated_price_number: calcTL,
            original_price: convertToLocale({
              amount: origCents,
              currency_code: priceObj.currency_code || "TRY",
            }),
            calculated_price: convertToLocale({
              amount: calcCents,
              currency_code: priceObj.currency_code || "TRY",
            }),
            price_type: "sale",
            percentage_diff: getPercentageDiff(parsedOriginal, calcTL),
          }
        }
      }
    }

    // Always ensure calculated_price is correctly formatted with calcCents
    return {
      ...priceObj,
      original_price_number: (priceObj.original_price_number || 0) / 100,
      calculated_price_number: calcTL,
      calculated_price: convertToLocale({
        amount: calcCents,
        currency_code: priceObj.currency_code || "TRY",
      }),
    }
  }

  return {
    product,
    cheapestPrice: applyMetadataDiscount(cheapestPrice()),
    variantPrice: applyMetadataDiscount(variantPrice()),
  }
}
