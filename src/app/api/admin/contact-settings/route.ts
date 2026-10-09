import { cleanContactValue } from "@lib/content/contact-info"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { encryptSettings } from "@lib/security/encrypted-settings"
import { normalizeWhatsAppPhone } from "@lib/content/whatsapp"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const rows = await query<{ key: string; value: any }>(
      `SELECT key, value FROM store_settings WHERE key IN ('contact_info', 'smtp_settings')`
    )

    const result: Record<string, any> = {
      contact_info: {
        eyebrow: "İLETİŞİM",
        title: "İletişim",
        description: "Ürün seçimi, sipariş ve satış sonrası destek için ekibimizle iletişime geçin.",
        phone: "",
        phone_raw: "",
        phone_hours: "",
        email: "",
        email_response_time: "",
        address: "",
        street_address: "",
        district: "",
        city: "",
        country: "",
        full_address: "",
        whatsapp_phone: "",
        whatsapp_text: "WhatsApp Canlı Destek Hattı",
        whatsapp_enabled: false,
        additional_notification_emails: "",
        company_name: "",
        brand_name: "Mağaza",
        website: "",
        tax_office: "",
        tax_no: "",
        mersis_no: "",
        kep_address: "",
        trade_reg_no: "",
        work_hours: "",
        form_title: "Mesaj Gönderin",
        form_description: "Formu doldurun; mesajınız destek ekibimize kaydedilsin.",
        kvkk_url: "/kvkk",
        guarantees: []
      },
      smtp_settings: {
        host: "",
        port: "587",
        user: "",
        pass: "",
        from_email: "",
        recipient_email: "",
        enable_notifications: false,
        secure: false
      }
    }

    for (const r of rows) {
      if (r.key === 'contact_info') result.contact_info = { ...result.contact_info, ...r.value }
      if (r.key === "smtp_settings") {
        result.smtp_settings = {
          ...result.smtp_settings,
          ...r.value,
          pass: r.value?.encrypted_pass || r.value?.pass ? "••••••••" : "",
          encrypted_pass: undefined,
        }
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await request.json()
    const { contact_info, smtp_settings } = body

    await query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    if (contact_info) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const primaryEmail = String(contact_info.email || "").trim().toLowerCase()
      const extraEmails = (Array.isArray(contact_info.additional_notification_emails)
        ? contact_info.additional_notification_emails
        : String(contact_info.additional_notification_emails || "").split(/[;,\s]+/))
        .map((value: unknown) => String(value || "").trim().toLowerCase())
        .filter(Boolean)
      if (!emailPattern.test(primaryEmail) || extraEmails.some((email: string) => !emailPattern.test(email))) {
        return NextResponse.json({ error: "Lütfen bildirim e-posta adreslerini kontrol edin." }, { status: 400 })
      }
      const existingRows = await query<{ value: any }>(
        `SELECT value FROM store_settings WHERE key = 'contact_info' LIMIT 1`
      )
      const existingVal = existingRows[0]?.value || {}
      const mergedContact = { ...existingVal, ...contact_info }
      mergedContact.email = primaryEmail
      mergedContact.additional_notification_emails = Array.from(new Set(extraEmails)).join(", ")
      mergedContact.whatsapp_phone = normalizeWhatsAppPhone(
        contact_info.whatsapp_phone || contact_info.phone || existingVal.whatsapp_phone
      )

      const addressKeys = ["full_address", "company_address", "address", "card4_address"]
      const submittedAddressKey = addressKeys.find((key) => Object.prototype.hasOwnProperty.call(contact_info, key))
      const chosenAddress = submittedAddressKey
        ? cleanContactValue(contact_info[submittedAddressKey])
        : addressKeys.map((key) => cleanContactValue(existingVal[key])).find(Boolean) || ""

      mergedContact.full_address = chosenAddress
      mergedContact.address = chosenAddress
      mergedContact.company_address = chosenAddress
      mergedContact.card4_address = chosenAddress
      if (mergedContact.email) {
        mergedContact.card1_email = mergedContact.email
        mergedContact.card2_email = mergedContact.email
        mergedContact.card3_email = mergedContact.email
        mergedContact.company_email = mergedContact.email
      }
      if (mergedContact.phone) {
        mergedContact.card1_phone = mergedContact.phone
        mergedContact.card2_phone = mergedContact.phone
        mergedContact.card3_phone = mergedContact.phone
        mergedContact.company_phone = mergedContact.phone
      }

      if (!mergedContact.map_embed_url || mergedContact.map_embed_url.includes("Ümraniye") || mergedContact.map_embed_url.includes("0x14cac851604a11ad")) {
        mergedContact.map_embed_url = `https://maps.google.com/maps?q=${encodeURIComponent(chosenAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      }

      await query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ('contact_info', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(mergedContact)]
      )

      try {
        await query(
          `UPDATE theme_settings SET contact_address = $1 WHERE id = 1`,
          [chosenAddress]
        )
      } catch {}
    }

    if (smtp_settings) {
      const existingRows = await query<{ value: any }>(
        `SELECT value FROM store_settings WHERE key='smtp_settings' LIMIT 1`
      )
      const existing = existingRows[0]?.value || {}
      const suppliedPassword = String(smtp_settings.pass || "")
      const encryptedPass =
        suppliedPassword && suppliedPassword !== "••••••••"
          ? encryptSettings({ pass: suppliedPassword })
          : existing.encrypted_pass ||
            (existing.pass ? encryptSettings({ pass: String(existing.pass) }) : "")
      const safeSmtpSettings = {
        ...smtp_settings,
        // Tek yönetim noktası: admin bildirim adresi İletişim Bilgileri > E-posta'dır.
        recipient_email:
          contact_info?.email ||
          smtp_settings.recipient_email ||
          existing.recipient_email ||
          "",
        pass: undefined,
        encrypted_pass: encryptedPass,
      }
      await query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ('smtp_settings', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(safeSmtpSettings)]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
