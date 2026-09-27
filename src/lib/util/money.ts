type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code = "TRY",
  locale = "tr-TR",
}: ConvertToLocaleParams) => {
  const val = typeof amount === "number" ? amount : parseFloat(String(amount || 0))
  if (isNaN(val)) return "0,00 TL"
  const formatted = (val / 100).toLocaleString(locale || "tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (!currency_code || currency_code.toUpperCase() === "TRY" || currency_code.toUpperCase() === "TL") {
    return `${formatted} TL`
  }
  return `${formatted} ${currency_code.toUpperCase()}`
}

/** TL cinsinden bir değeri 7.999,00 TL standardında gösterir. */
export const formatTryPrice = (amount: number | string) => {
  const value = typeof amount === "number" ? amount : Number(amount)
  if (!Number.isFinite(value)) return "0,00 TL"
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`
}

export const parseTryPriceInput = (input: string | number) => {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0
  const value = String(input || "").trim().replace(/\s|TL|₺/gi, "")
  if (!value) return 0
  if (value.includes(",")) {
    return Number(value.replace(/\./g, "").replace(",", ".")) || 0
  }
  if (/^\d+\.\d{1,2}$/.test(value)) return Number(value) || 0
  return Number(value.replace(/\./g, "")) || 0
}

export const formatTryPriceInput = (input: string | number) =>
  parseTryPriceInput(input).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
