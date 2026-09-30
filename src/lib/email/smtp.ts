import nodemailer from "nodemailer"
import { query } from "@lib/admin/db"
import { decryptSettings } from "@lib/security/encrypted-settings"

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function smtpConnectionOptions(settings: { host: string; port?: string | number; secure?: boolean }) {
  const port = Number(settings.port || 587)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Geçerli bir SMTP portu girin.")
  }
  const secure = port === 465 || settings.secure === true
  return {
    host: settings.host,
    port,
    secure,
    requireTLS: !secure,
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" as const },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  }
}

async function smtpTransport() {
  const rows = await query<{ value: any }>(
    `SELECT value FROM store_settings WHERE key='smtp_settings' LIMIT 1`
  )
  const settings = rows[0]?.value
  if (!settings?.host) return null
  const password =
    decryptSettings(settings.encrypted_pass).pass || settings.pass || ""
  const transporter = nodemailer.createTransport({
    ...smtpConnectionOptions(settings),
    auth: settings.user
      ? {
          user: settings.user,
          pass: password,
        }
      : undefined,
  })
  return { transporter, settings }
}

export async function sendSmtpEmail(input: {
  to: string
  subject: string
  html: string
  replyTo?: string
  bcc?: string | string[]
}) {
  const configured = await smtpTransport()
  if (!configured) {
    return { sent: false, configured: false }
  }
  await configured.transporter.sendMail({
    from:
      configured.settings.from_email ||
      configured.settings.user ||
      "no-reply@zk-home.com",
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ...(input.bcc ? { bcc: input.bcc } : {}),
  })
  return { sent: true, configured: true }
}

export async function sendContactNotificationEmail(data: {
  name: string
  email: string
  phone?: string
  subject?: string
  order_no?: string
  message: string
}) {
  try {
    const configured = await smtpTransport()
    if (!configured?.settings.enable_notifications || !configured.settings.recipient_email) {
      return { sent: false, reason: "SMTP bildirimleri kapalı veya eksik alıcı e-postası." }
    }
    const { transporter, settings } = configured

    const safeName = escapeHtml(data.name)
    const safeEmail = escapeHtml(data.email)
    const safePhone = escapeHtml(data.phone || "Belirtilmedi")
    const safeSubject = escapeHtml(data.subject || "Genel")
    const safeOrderNo = escapeHtml(data.order_no || "")
    const safeMessage = escapeHtml(data.message)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #C98484; border-b: 2px solid #C98484; padding-bottom: 10px;">Yeni İletişim Formu Mesajı</h2>
        <p><strong>Gönderen:</strong> ${safeName} (&lt;${safeEmail}&gt;)</p>
        <p><strong>Telefon:</strong> ${safePhone}</p>
        <p><strong>Konu:</strong> ${safeSubject}</p>
        ${safeOrderNo ? `<p><strong>Sipariş No:</strong> ${safeOrderNo}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Mesaj:</strong></p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${safeMessage}</div>
        <br />
        <small style="color: #888;">Bu e-posta ZK HOME İletişim Formu üzerinden otomatik gönderilmiştir.</small>
      </div>
    `

    await transporter.sendMail({
      from: settings.from_email || settings.user || "no-reply@zk-home.com",
      to: settings.recipient_email,
      subject: `[İletişim Formu] ${data.subject || 'Yeni Mesaj'} - ${data.name}`,
      html: htmlContent,
    })

    return { sent: true }
  } catch (error: any) {
    console.error("SMTP Mail Error:", error)
    return { sent: false, error: error.message }
  }
}

export async function testSmtpConnection(settings: any) {
  try {
    const transporter = nodemailer.createTransport({
      ...smtpConnectionOptions(settings),
      auth: settings.user ? {
        user: settings.user,
        pass: settings.pass || "",
      } : undefined,
    })

    await transporter.verify()
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}
