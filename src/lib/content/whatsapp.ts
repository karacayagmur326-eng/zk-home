export function normalizeWhatsAppPhone(value: unknown) {
  let digits = String(value || "").replace(/\D/g, "")

  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("0") && digits.length === 11) digits = `90${digits.slice(1)}`
  if (digits.length === 10) digits = `90${digits}`

  return digits
}

export function getWhatsAppUrl(value: unknown, message?: string) {
  const phone = normalizeWhatsAppPhone(value)
  if (!phone) return ""

  const params = new URLSearchParams({ phone })
  if (message) params.set("text", message)

  // api.whatsapp.com masaüstünde WhatsApp Web'e, mobilde uygulamaya güvenli biçimde yönlendirir.
  return `https://api.whatsapp.com/send?${params.toString()}`
}
