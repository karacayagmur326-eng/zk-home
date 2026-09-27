import "server-only"
import { getIyzicoConfig, authorization } from "./iyzico"

export type InstallmentOption = {
  installmentNumber: number
  installmentPrice: number
  totalPrice: number
  monthlyFormatted: string
  totalFormatted: string
}

export type BankInstallmentDetail = {
  cardFamily: string
  bankName: string
  badgeBg: string
  badgeText: string
  installments: InstallmentOption[]
}

const SUPPORTED_BANKS = [
  {
    cardFamily: "Bonus",
    bankName: "Garanti, TEB, Denizbank, Şekerbank, ING",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
  {
    cardFamily: "World",
    bankName: "Yapı Kredi, Albaraka, Vakıfbank",
    badgeBg: "bg-purple-700",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
  {
    cardFamily: "Maximum",
    bankName: "İş Bankası",
    badgeBg: "bg-pink-700",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
  {
    cardFamily: "Axess",
    bankName: "Akbank",
    badgeBg: "bg-amber-600",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
  {
    cardFamily: "CardFinans",
    bankName: "QNB Finansbank",
    badgeBg: "bg-sky-700",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
  {
    cardFamily: "Paraf",
    bankName: "Halkbank",
    badgeBg: "bg-cyan-700",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
  {
    cardFamily: "Advantage",
    bankName: "HSBC",
    badgeBg: "bg-red-700",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
  {
    cardFamily: "Combo",
    bankName: "Ziraat Bankası",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
  {
    cardFamily: "Sağlam Kart",
    bankName: "Kuveyt Türk",
    badgeBg: "bg-teal-700",
    badgeText: "text-white",
    rates: { 1: 0, 2: 0.045, 3: 0.065, 6: 0.115, 9: 0.165, 12: 0.215 },
  },
]

function formatCurrency(amount: number): string {
  return amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " ₺"
}

export function generateCalculatedInstallments(price: number): BankInstallmentDetail[] {
  const safePrice = Math.max(0, Number(price) || 0)

  return SUPPORTED_BANKS.map((bank) => {
    const installments: InstallmentOption[] = Object.entries(bank.rates).map(
      ([countStr, rate]) => {
        const count = Number(countStr)
        const total = Number((safePrice * (1 + rate)).toFixed(2))
        const monthly = Number((total / count).toFixed(2))

        return {
          installmentNumber: count,
          installmentPrice: monthly,
          totalPrice: total,
          monthlyFormatted: formatCurrency(monthly),
          totalFormatted: formatCurrency(total),
        }
      }
    )

    return {
      cardFamily: bank.cardFamily,
      bankName: bank.bankName,
      badgeBg: bank.badgeBg,
      badgeText: bank.badgeText,
      installments,
    }
  })
}

/**
 * Queries live installment info from iyzico API for a given price
 */
export async function getIyzicoInstallments(price: number): Promise<{
  source: "iyzico" | "fallback"
  price: number
  banks: BankInstallmentDetail[]
}> {
  const safePrice = Math.max(0, Number(price) || 0)
  if (safePrice <= 0) {
    return {
      source: "fallback",
      price: 0,
      banks: generateCalculatedInstallments(0),
    }
  }

  try {
    const config = await getIyzicoConfig()
    if (!config) {
      return {
        source: "fallback",
        price: safePrice,
        banks: generateCalculatedInstallments(safePrice),
      }
    }

    const path = "/payment/iyzipos/installment"
    const payload = {
      locale: "tr",
      conversationId: `inst_${Date.now()}`,
      price: safePrice.toFixed(2),
    }

    const body = JSON.stringify(payload)
    const auth = authorization(config.apiKey, config.secretKey, path, body)

    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: auth.authorization,
        "x-iyzi-rnd": auth.randomKey,
        "x-iyzi-client-version": "iyzipay-node-2.0.0",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })

    const data = await res.json().catch(() => null)

    if (
      res.ok &&
      data &&
      data.status === "success" &&
      Array.isArray(data.installmentDetails) &&
      data.installmentDetails.length > 0
    ) {
      const bankMap = new Map<string, BankInstallmentDetail>()

      for (const item of data.installmentDetails) {
        const familyName = String(item.cardFamilyName || "").trim() || "Diğer"
        const existing = bankMap.get(familyName)
        const bankMeta = SUPPORTED_BANKS.find(
          (b) => b.cardFamily.toLowerCase() === familyName.toLowerCase()
        )

        const rawPrices = Array.isArray(item.installmentPrices)
          ? item.installmentPrices
          : []

        const installments: InstallmentOption[] = rawPrices.map((p: any) => {
          const count = Number(p.installmentNumber) || 1
          const monthly = Number(p.installmentPrice) || safePrice
          const total = Number(p.totalPrice) || safePrice
          return {
            installmentNumber: count,
            installmentPrice: monthly,
            totalPrice: total,
            monthlyFormatted: formatCurrency(monthly),
            totalFormatted: formatCurrency(total),
          }
        })

        if (!existing || installments.length > existing.installments.length) {
          bankMap.set(familyName, {
            cardFamily: familyName,
            bankName: item.bankName || bankMeta?.bankName || familyName,
            badgeBg: bankMeta?.badgeBg || "bg-slate-700",
            badgeText: bankMeta?.badgeText || "text-white",
            installments,
          })
        }
      }

      if (bankMap.size > 0) {
        return {
          source: "iyzico",
          price: safePrice,
          banks: Array.from(bankMap.values()),
        }
      }
    }
  } catch (err) {
    // Silently fallback to calculated table if iyzico is temporarily unreachable
  }

  return {
    source: "fallback",
    price: safePrice,
    banks: generateCalculatedInstallments(safePrice),
  }
}
