import { CreditCard } from "@lib/icons"
import React from "react"

/* Iyzico logo as SVG */
const IyzicoIcon = () => (
  <svg viewBox="0 0 100 30" width="72" height="22" aria-label="iyzico">
    <g fill="none" fillRule="evenodd">
      <rect width="100" height="30" rx="6" fill="#0066CC" />
      <text
        x="50"
        y="21"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="15"
        fontWeight="bold"
        fill="white"
        letterSpacing="1"
      >
        iyzico
      </text>
    </g>
  </svg>
)

/* Map of payment provider_id to their title and icon. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  // Iyzico provider IDs (cover all common Medusa plugin naming conventions)
  pp_iyzico_iyzico: {
    title: "iyzico ile Öde",
    icon: <IyzicoIcon />,
  },
  pp_iyzico_default: {
    title: "iyzico ile Öde",
    icon: <IyzicoIcon />,
  },
  // Manual / bank transfer — also shown as Iyzico on storefront
  pp_system_default: {
    title: "iyzico ile Öde",
    icon: <IyzicoIcon />,
  },
  // Legacy Stripe entries (kept for compatibility; not displayed to users)
  pp_stripe_stripe: {
    title: "Banka veya kredi kartı",
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: "Banka veya kredi kartı",
    icon: <CreditCard />,
  },
}

/* ─── Provider type helpers ─────────────────────────────── */

export const isIyzico = (providerId?: string) =>
  !!providerId &&
  (providerId.startsWith("pp_iyzico") || providerId === "pp_system_default")

export const isStripeLike = (providerId?: string) =>
  providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")

export const isPaypal = (providerId?: string) =>
  !!providerId?.startsWith("pp_paypal")

export const isManual = (providerId?: string) =>
  !!providerId?.startsWith("pp_system_default")

/* ─── Currency config ──────────────────────────────────── */

// Currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
