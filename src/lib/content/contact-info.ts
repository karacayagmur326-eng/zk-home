import { getThemeSettings } from "@lib/content/theme-settings"
import { getBaseURL } from "@lib/util/env"
/**
 * Merkezi İletişim Bilgileri Sistemi
 *
 * Admin panelindeki "İletişim Ayarları" (store_settings tablosu, key='contact_info')
 * üzerinden yönetilen iletişim bilgilerini döndürür.
 *
 * Kullanım:
 *   import { getContactInfo, CONTACT_DEFAULTS } from "@lib/content/contact-info"
 *   const contact = await getContactInfo()
 */

import { query } from "@lib/admin/db"
import { normalizeWhatsAppPhone } from "@lib/content/whatsapp"

/** Varsayılan (fallback) iletişim bilgileri - adminden değiştirilene kadar geçerli */
export const CONTACT_DEFAULTS = {
  // Temel iletişim
  phone: "",
  phone_raw: "", // tel: linkler için
  whatsapp_phone: "",
  whatsapp_text: "WhatsApp ile iletişime geç",
  whatsapp_enabled: false,
  additional_notification_emails: "",
  email: "",

  // Şirket bilgileri
  company_name: "",
  brand_name: "",
  website: "",

  // Adres
  street_address: "",
  district: "",
  city: "",
  country: "Türkiye",
  postal_code: "",
  full_address: "",

  // Yasal bilgiler
  tax_office: "",
  tax_no: "",
  mersis_no: "",
  kep_address: "",
  trade_reg_no: "",

  // Çalışma saatleri
  work_hours: "Hafta içi 09:00 - 18:00",

  // Ortak iletişim formu
  form_title: "Bize Mesaj Gönderin",
  form_description:
    "Aşağıdaki formu doldurarak müşteri temsilcilerimize doğrudan mesajınızı iletebilirsiniz.",
  kvkk_url: "/kvkk",

  // Google Maps
  map_url:
    "https://maps.google.com",
  map_embed_url: "",
}

export type ContactInfo = typeof CONTACT_DEFAULTS

let _cachedContactInfo: ContactInfo | null = null
let _cacheTime = 0
const CACHE_TTL_MS = 60 * 1000 // 1 dakika cache

/**
 * Admin panelinden yönetilen iletişim bilgilerini döndürür.
 * DB'de kayıt yoksa CONTACT_DEFAULTS kullanılır.
 * Sunucu taraflı çağrılmalıdır (Server Component / API Route).
 */
export async function getContactInfo(): Promise<ContactInfo> {
  const now = Date.now()
  if (_cachedContactInfo && now - _cacheTime < CACHE_TTL_MS) {
    return _cachedContactInfo
  }

  const theme = await getThemeSettings()
  const defaults = { ...CONTACT_DEFAULTS, brand_name: theme?.logo_text || "", company_name: theme?.logo_text || "", website: getBaseURL() }
  try {
    const rows = await query<{ value: Record<string, any> }>(
      `SELECT value FROM store_settings WHERE key = 'contact_info' LIMIT 1`
    )
    if (rows.length > 0 && rows[0].value) {
      const dbData = rows[0].value
      // DB verisini defaults ile birleştir (eksik alanlar default'tan gelir)
      const merged: ContactInfo = {
        ...defaults,
        ...dbData,
        brand_name: dbData.brand_name || defaults.brand_name,
        company_name: dbData.company_name || dbData.brand_name || defaults.company_name,
        website: dbData.website || defaults.website,
        // phone_raw: telefon numarasından tüm harf-dışı karakterleri kaldır
        phone_raw: (dbData.phone || CONTACT_DEFAULTS.phone).replace(/\D/g, ""),
        // whatsapp: TR kodu ekli tam numara
        whatsapp_phone: normalizeWhatsAppPhone(
          dbData.whatsapp_phone || dbData.phone || CONTACT_DEFAULTS.phone
        ),
        // full_address: eğer ayrı ayrı girilmişse birleştir
        full_address:
          dbData.full_address ||
          [
            dbData.street_address || CONTACT_DEFAULTS.street_address,
            dbData.district || CONTACT_DEFAULTS.district,
            dbData.city || CONTACT_DEFAULTS.city,
            dbData.country || CONTACT_DEFAULTS.country,
          ]
            .filter(Boolean)
            .join(", "),
      }
      _cachedContactInfo = merged
      _cacheTime = now
      return merged
    }
  } catch {
    // DB hatası → defaults ile devam et
  }

  _cachedContactInfo = defaults
  _cacheTime = now
  return defaults
}

/** Cache'i temizle (ayar kaydedildikten sonra çağrılır) */
export function invalidateContactInfoCache() {
  _cachedContactInfo = null
  _cacheTime = 0
}
