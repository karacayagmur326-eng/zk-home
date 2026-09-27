import { z } from "zod"

/**
 * BirFatura dd.MM.yyyy HH:mm:ss tarih ayrıştırıcı
 */
export function parseBirFaturaDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null

  // Format: dd.MM.yyyy HH:mm:ss veya dd.MM.yyyy
  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    const year = parseInt(match[3], 10)
    const hours = match[4] ? parseInt(match[4], 10) : 0
    const minutes = match[5] ? parseInt(match[5], 10) : 0
    const seconds = match[6] ? parseInt(match[6], 10) : 0

    // Explicit Turkey wall time; Vercel runs in UTC, independent of developer TZ.
    const wallTime = new Date(Date.UTC(year, month, day, hours, minutes, seconds))
    if (wallTime.getUTCFullYear() !== year || wallTime.getUTCMonth() !== month ||
        wallTime.getUTCDate() !== day || hours > 23 || minutes > 59 || seconds > 59) return null
    return new Date(wallTime.getTime() - 3 * 60 * 60 * 1000)
  }

  // ISO timestamps must include their timezone; do not guess server-local time.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(trimmed)) return null
  const fallback = new Date(trimmed)
  return isNaN(fallback.getTime()) ? null : fallback
}

/**
 * JavaScript Date nesnesini BirFatura dd.MM.yyyy HH:mm:ss formatına dönüştürür.
 */
export function formatBirFaturaDate(date: Date | string | number | null | undefined): string {
  if (!date) return ""
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ""

  // Türkiye saat diliminde (Europe/Istanbul) formatla
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  // Format: "09.02.2018 12:00:25"
  return formatter.format(d).replace(/\//g, ".")
}

/**
 * /api/orders request validasyon şeması
 */
const optionalDate = z.string().trim().max(40)
  .refine(value => Boolean(parseBirFaturaDate(value)), "Geçersiz tarih.").optional()
export const BirFaturaOrdersRequestSchema = z.object({
  orderStatusId: z.coerce.number().int().min(1).max(3).optional(),
  startDateTime: optionalDate,
  endDateTime: optionalDate,
}).refine(value => !value.startDateTime || !value.endDateTime ||
  parseBirFaturaDate(value.startDateTime)!.getTime() <= parseBirFaturaDate(value.endDateTime)!.getTime(),
  "Başlangıç tarihi bitiş tarihinden sonra olamaz.")

/**
 * /api/orderCargoUpdate request validasyon şeması
 */
export const BirFaturaCargoUpdateSchema = z.object({
  orderId: z.coerce.number(),
  orderStatusId: z.coerce.number().optional().default(2),
  cargoTrackingCode: z.string().min(1, "cargoTrackingCode zorunludur."),
  cargoCompany: z.string().optional().default(""),
  cargoTrackingCodeUrl: z.string().optional().default(""),
  updateDateTime: z.string().optional(),
})

/**
 * /api/invoiceLinkUpdate request validasyon şeması
 */
export const BirFaturaInvoiceUpdateSchema = z.object({
  orderId: z.coerce.number(),
  faturaUrl: z.string().min(1, "faturaUrl zorunludur."),
  faturaNo: z.string().optional().default(""),
  faturaTarihi: z.string().optional().default(""),
})
