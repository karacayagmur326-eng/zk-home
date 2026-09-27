import "server-only"

import { query } from "@lib/admin/db"
import { getBaseURL } from "@lib/util/env"

export type EmailBrandSettings = {
  brandName: string
  companyName: string
  logoUrl: string
  websiteUrl: string
  contactEmail: string
  adminEmail: string
  adminEmails: string[]
  replyTo: string
  primaryColor: string
}

function absoluteAssetUrl(value: unknown, baseUrl: string) {
  const candidate = String(value || "").trim()
  if (/^https:\/\//i.test(candidate)) return candidate
  if (candidate.startsWith("/")) return `${baseUrl}${candidate}`
  return `${baseUrl}/brand/zkhome-logo.svg`
}

export async function getEmailBrandSettings(): Promise<EmailBrandSettings> {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const [storeRows, themeRows] = await Promise.all([
    query<{ key: string; value: Record<string, unknown> }>(
      `SELECT key,value FROM store_settings WHERE key IN ('contact_info','smtp_settings')`
    ).catch(() => []),
    query<Record<string, unknown>>(
      `SELECT logo_text,header_logo_url,admin_logo_url,primary_color FROM theme_settings WHERE id=1 LIMIT 1`
    ).catch(() => []),
  ])
  const contact = storeRows.find((row) => row.key === "contact_info")?.value || {}
  const smtp = storeRows.find((row) => row.key === "smtp_settings")?.value || {}
  const theme = themeRows[0] || {}
  const contactEmail = String(contact.email || "info@zk-home.com").trim()
  const adminEmail = String(contactEmail || smtp.recipient_email || "").trim()
  const additionalAdminEmails = (Array.isArray(contact.additional_notification_emails)
    ? contact.additional_notification_emails
    : String(contact.additional_notification_emails || "").split(/[;,\s]+/))
    .map((value) => String(value || "").trim().toLowerCase())
    .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
  const adminEmails = Array.from(
    new Set([adminEmail.toLowerCase(), ...additionalAdminEmails].filter(Boolean))
  )

  return {
    brandName: String(contact.brand_name || theme.logo_text || "ZK Home"),
    companyName: String(contact.company_name || contact.brand_name || "ZK Home"),
    logoUrl: absoluteAssetUrl(
      theme.header_logo_url || theme.admin_logo_url,
      baseUrl
    ),
    websiteUrl: String(contact.website || baseUrl),
    contactEmail,
    adminEmail,
    adminEmails,
    replyTo: contactEmail,
    primaryColor: String(theme.primary_color || "#C98484"),
  }
}
