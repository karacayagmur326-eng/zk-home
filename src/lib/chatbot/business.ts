import "server-only"

import { getContactInfo } from "@lib/content/contact-info"
import { normalizeChatbotText } from "./settings"

function hasStem(tokens: string[], ...stems: string[]) {
  return tokens.some((token) => stems.some((stem) => token === stem || token.startsWith(stem)))
}

function displayWhatsApp(value: string) {
  const digits = String(value || "").replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("90")) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
  }
  return value
}

export async function getBusinessGrounding() {
  const contact = await getContactInfo()
  const workHours = contact.work_hours || String((contact as Record<string, unknown>).phone_hours || "")
  return [
    `Marka: ${contact.brand_name}`,
    `Şirket: ${contact.company_name}`,
    `Telefon: ${contact.phone}`,
    `E-posta: ${contact.email}`,
    contact.whatsapp_enabled ? `WhatsApp: ${displayWhatsApp(contact.whatsapp_phone)}` : "WhatsApp: aktif değil",
    `Çalışma saatleri: ${workHours}`,
    `Adres: ${contact.full_address}`,
    `Web sitesi: ${contact.website}`,
    `Vergi dairesi: ${contact.tax_office}`,
    `Vergi numarası: ${contact.tax_no}`,
    `MERSİS: ${contact.mersis_no}`,
    `KEP: ${contact.kep_address}`,
  ].filter((line) => !line.endsWith(": ")).join("\n")
}

type BusinessHistoryItem = { role: "user" | "bot"; text: string }

export async function analyzeBusinessQuestion(message: string, history: BusinessHistoryItem[] = []) {
  const normalized = normalizeChatbotText(message)
  const tokens = normalized.split(" ").filter(Boolean)
  const previousContext = normalizeChatbotText(history.slice(-3).map((item) => item.text).join(" "))
  const asksAlternative = hasStem(tokens, "baska", "diger", "alternatif")
  const asksPhone = hasStem(tokens, "telefon", "numara", "tel", "aray")
  const asksEmail = hasStem(tokens, "eposta", "email", "mail") || /\be\s+posta\b/.test(normalized)
  const asksWhatsApp = hasStem(tokens, "whatsapp", "watsap", "wp")
  // "E-posta adresi" bir fiziksel adres talebi değildir.
  const asksAddress = !asksEmail && hasStem(tokens, "adres", "konum", "lokasyon")
  const asksContact = hasStem(tokens, "iletisim", "ulas", "eris")
  const asksHours = hasStem(tokens, "acik", "kapan", "calisma")
    || (hasStem(tokens, "saat") && (asksContact || hasStem(tokens, "magaza", "ofis")))
  const asksCompany = hasStem(tokens, "kimsiniz")
    || /\b(firma|sirket|marka)(niz|nizin)? adi\b/.test(normalized)
  const asksLegal = hasStem(tokens, "vergi", "mersis", "kep")

  if (!(asksPhone || asksEmail || asksWhatsApp || asksAddress || asksHours || asksContact || asksCompany || asksLegal)) {
    return null
  }

  const contact = await getContactInfo()
  const workHours = contact.work_hours || String((contact as Record<string, unknown>).phone_hours || "")
  const details: string[] = []

  if (asksPhone || (asksContact && !asksEmail && !asksAddress && !asksHours && !asksWhatsApp)) {
    details.push(asksAlternative && /(telefon|numara|iletisim)/.test(previousContext)
      ? `Müşterilerimiz için yayımlanan telefon numaramız ${contact.phone}. Başka bir destek numarası şu anda sitede yer almıyor.`
      : `Bize ${contact.phone} numaralı telefondan ulaşabilirsiniz${workHours ? ` (${workHours})` : ""}.`)
  }
  if (asksEmail || (asksContact && !asksPhone && !asksAddress && !asksHours && !asksWhatsApp)) {
    details.push(asksAlternative && /(eposta|email|mail|iletisim)/.test(previousContext)
      ? `Müşterilerimiz için yayımlanan e-posta adresimiz ${contact.email}. Başka bir destek e-posta adresi şu anda sitede yer almıyor.`
      : `Bize ${contact.email} adresinden e-posta gönderebilirsiniz.`)
  }
  if (asksWhatsApp) {
    details.push(contact.whatsapp_enabled
      ? `WhatsApp üzerinden ${displayWhatsApp(contact.whatsapp_phone)} numarasından bize yazabilirsiniz.`
      : "WhatsApp hattımız şu anda aktif değil.")
  }
  if (asksAddress) details.push(`Adresimiz: ${contact.full_address}`)
  if (asksHours) details.push(`Çalışma saatlerimiz: ${workHours}`)
  if (asksCompany) details.push(`${contact.brand_name}, ${contact.company_name} markasıdır.`)
  if (asksLegal && normalized.includes("vergi")) details.push(`Vergi dairesi: ${contact.tax_office} · Vergi no: ${contact.tax_no}`)
  if (asksLegal && normalized.includes("mersis")) details.push(`MERSİS: ${contact.mersis_no}`)
  if (asksLegal && normalized.includes("kep")) details.push(`KEP: ${contact.kep_address}`)

  if (details.length === 0) return null
  return {
    answer: details.join("\n"),
    link_url: "/iletisim",
    link_text: "İletişim Sayfasını Aç",
    source: "business_info" as const,
  }
}
