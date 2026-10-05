import "server-only"

import { cache } from "react"
import { cachedQuery } from "@lib/admin/db"
import { normalizePublicImageUrl } from "@lib/security/public-assets"

// Deduplicate metadata, root layout, storefront shell and navigation reads
// that happen during the same server render.
export const getThemeSettings = cache(async () =>
  cachedQuery<any>("theme-settings", "SELECT * FROM theme_settings WHERE id = 1", [], 60)
    .then((rows) => {
      const settings = rows[0]
      if (!settings) return null
      return {
        ...settings,
        header_logo_url: normalizePublicImageUrl(settings.header_logo_url, "/brand/zkhome-logo.svg"),
        header_logo_dark_url: normalizePublicImageUrl(settings.header_logo_dark_url, "/brand/zkhome-logo-dark.svg"),
        footer_logo_url: normalizePublicImageUrl(settings.footer_logo_url, "/brand/zkhome-logo.svg"),
        footer_logo_dark_url: normalizePublicImageUrl(settings.footer_logo_dark_url, "/brand/zkhome-logo-dark.svg"),
        favicon_url: normalizePublicImageUrl(settings.favicon_url, "/brand/zkhome-favicon.svg"),
        admin_logo_url: normalizePublicImageUrl(settings.admin_logo_url, "/brand/zkhome-logo.svg"),
        mini_logo_url: normalizePublicImageUrl(settings.mini_logo_url, "/brand/zkhome-favicon.svg"),
        payment_logo_iyzico: normalizePublicImageUrl(settings.payment_logo_iyzico),
        payment_logo_mastercard: normalizePublicImageUrl(settings.payment_logo_mastercard),
        payment_logo_visa: normalizePublicImageUrl(settings.payment_logo_visa),
        payment_logo_amex: normalizePublicImageUrl(settings.payment_logo_amex),
        payment_logo_troy: normalizePublicImageUrl(settings.payment_logo_troy),
      }
    })
    .catch(() => null)
)
