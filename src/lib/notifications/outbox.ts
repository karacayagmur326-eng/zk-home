import "server-only"

import { query } from "@lib/admin/db"
import { sendSmtpEmail } from "@lib/email/smtp"
import {
  EmailBrandSettings,
  getEmailBrandSettings,
} from "@lib/email/brand-settings"

type OutboxRow = {
  id: string
  type: string
  recipient: string
  subject: string
  payload: Record<string, unknown>
  attempts: number
}

type OutboxProcessResult = {
  processed: number
  sent: number
  configured: boolean
}

const EMAIL_PROVIDER_NOT_CONFIGURED = "E-posta sağlayıcısı yapılandırılmamış."
const ADMIN_COPY_TYPES = new Set([
  "order_created",
  "order_shipped",
  "order_local_delivery",
  "order_delivered",
  "invoice_issued",
])

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function emailHtml(row: OutboxRow, brand: EmailBrandSettings) {
  let innerHtml = ""
  if (row.type === "email_verification") {
    const verificationUrl = String(row.payload.verification_url || "")
    const link = /^https?:\/\//i.test(verificationUrl)
      ? `<p style="text-align: center; margin: 30px 0;"><a href="${escapeHtml(verificationUrl)}" style="background-color: #C98484; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">E-Posta Adresimi Doğrula</a></p>`
      : ""
    innerHtml = `
      <h2 style="color: #333; margin-bottom: 20px;">E-posta adresinizi doğrulayın</h2>
      <p style="color: #555; line-height: 1.6;">${escapeHtml(brand.brandName)} üyeliğinizi etkinleştirmek için aşağıdaki bağlantıyı kullanın.</p>
      ${link}
      <p style="color: #888; font-size: 13px; line-height: 1.6;">Bu bağlantı 24 saat geçerlidir.</p>
    `
  } else if (row.type === "password_reset") {
    const resetUrl = String(row.payload.reset_url || "")
    const link = /^https?:\/\//i.test(resetUrl)
      ? `<p style="text-align: center; margin: 30px 0;"><a href="${escapeHtml(resetUrl)}" style="background-color: #C98484; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Şifrenizi Yenileyin</a></p>`
      : ""
    innerHtml = `
      <h2 style="color: #333; margin-bottom: 20px;">Şifre sıfırlama talebi</h2>
      <p style="color: #555; line-height: 1.6;">${escapeHtml(brand.brandName)} hesabınız için bir şifre sıfırlama talebi aldık.</p>
      ${link}
      <p style="color: #888; font-size: 13px; line-height: 1.6;">Bu bağlantı 30 dakika geçerlidir. Talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
    `
  } else if (row.type === "account_welcome") {
    const firstName = escapeHtml(row.payload.first_name || "")
    innerHtml = `
      <h2 style="color: #333; margin-bottom: 20px;">Aramıza hoş geldiniz${firstName ? `, ${firstName}` : ""}!</h2>
      <p style="color: #555; line-height: 1.6;">${escapeHtml(brand.brandName)} hesabınız başarıyla doğrulandı.</p>
      <p style="color: #555; line-height: 1.6;">Hesabınızdan siparişlerinizi takip edebilir, favorilerinizi ve adreslerinizi yönetebilirsiniz.</p>
      <p style="text-align: center; margin: 30px 0;"><a href="${escapeHtml(brand.websiteUrl)}" style="background-color:${escapeHtml(brand.primaryColor)};color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Alışverişe Başla</a></p>
    `
  } else if (row.type === "password_changed") {
    innerHtml = `
      <h2 style="color: #333; margin-bottom: 20px;">Şifreniz değiştirildi</h2>
      <p style="color: #555; line-height: 1.6;">${escapeHtml(brand.brandName)} hesabınızın şifresi başarıyla güncellendi.</p>
      <p style="color: #555; line-height: 1.6;">Bu işlemi siz yapmadıysanız lütfen hemen destek ekibimizle iletişime geçin.</p>
    `
  } else if (row.type === "order_local_delivery") {
    innerHtml = `
      <h2 style="color:#172033;margin-bottom:20px;">ZK Home teslimatınız planlandı</h2>
      <p style="color:#475467;line-height:1.7;">Değerli Müşterimiz,</p>
      <p style="color:#475467;line-height:1.7;"><strong>${escapeHtml(row.payload.order_id)}</strong> numaralı siparişiniz, <strong>${escapeHtml(row.payload.delivery_window)}</strong> ZK Home teslimat ekibi tarafından teslimat adresinize bizzat ulaştırılacaktır.</p>
      <p style="color:#475467;line-height:1.7;">Teslimatınız ZK Home ekibi tarafından gerçekleştirileceği için bir kargo takip numarası bulunmamaktadır. Belirtilen zaman aralığında adresinizde bulunmanızı rica ederiz.</p>
      <p style="color:#475467;line-height:1.7;">Adres bilgilerinizde değişiklik veya teslimatla ilgili bir talebiniz varsa bu e-postayı yanıtlayarak ya da hesabınızdaki Mesajlarım bölümünden bizimle iletişime geçebilirsiniz.</p>
      <p style="color:#475467;line-height:1.7;">Saygılarımızla,<br><strong>ZK Home Müşteri Deneyimi Ekibi</strong></p>`
  } else if (row.type === "order_shipped") {
    const orderId = escapeHtml(row.payload.order_id)
    const trackingUrl = String(row.payload.tracking_url || "")
    const trackingLink = /^https:\/\//i.test(trackingUrl)
      ? `<p style="text-align: center; margin: 30px 0;"><a href="${escapeHtml(trackingUrl)}" style="background-color: #C98484; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Kargonuzu Takip Edin</a></p>`
      : ""
    innerHtml = `
      <h2 style="color: #333; margin-bottom: 20px;">Siparişiniz kargoya verildi</h2>
      <p style="color: #555; line-height: 1.6;"><strong>Sipariş No:</strong> ${orderId}</p>
      <p style="color: #555; line-height: 1.6;"><strong>Kargo Firması:</strong> ${escapeHtml(row.payload.carrier || "-")}</p>
      <p style="color: #555; line-height: 1.6;"><strong>Takip Numarası:</strong> ${escapeHtml(row.payload.tracking_number || "-")}</p>
      ${trackingLink}
    `
  } else if (row.type === "order_delivered") {
    const orderId = escapeHtml(row.payload.order_id)
    innerHtml = `
      <h2 style="color: #333; margin-bottom: 20px;">Siparişiniz teslim edildi</h2>
      <p style="color: #555; line-height: 1.6;"><strong>Sipariş No:</strong> ${orderId}</p>
      <p style="color: #555; line-height: 1.6;">Siparişinizin teslimatı tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz.</p>
    `
  } else if (row.type === "invoice_issued") {
    const orderCode = escapeHtml(row.payload.order_code || row.payload.order_id)
    const invoiceNumber = escapeHtml(row.payload.invoice_number || "")
    const invoiceUrl = String(row.payload.invoice_url || "")
    const invoiceLink = /^https:\/\//i.test(invoiceUrl)
      ? `<p style="text-align: center; margin: 30px 0;"><a href="${escapeHtml(invoiceUrl)}" style="background-color: #C98484; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Faturanızı Görüntüleyin</a></p>`
      : ""
    innerHtml = `
      <h2 style="color: #333; margin-bottom: 20px;">Faturanız hazır</h2>
      <p style="color: #555; line-height: 1.6;"><strong>Sipariş No:</strong> ${orderCode}</p>
      ${invoiceNumber ? `<p style="color: #555; line-height: 1.6;"><strong>Fatura No:</strong> ${invoiceNumber}</p>` : ""}
      <p style="color: #555; line-height: 1.6;">Siparişinize ait e-fatura oluşturuldu.</p>
      ${invoiceLink}
    `
  } else if (row.type === "contact_message_admin") {
    innerHtml = `
      <h2 style="color:#172033;margin:0 0 18px;">Yeni iletişim talebi</h2>
      <p style="color:#555;line-height:1.65;"><strong>Gönderen:</strong> ${escapeHtml(row.payload.name)}</p>
      <p style="color:#555;line-height:1.65;"><strong>E-posta:</strong> ${escapeHtml(row.payload.email)}</p>
      <p style="color:#555;line-height:1.65;"><strong>Telefon:</strong> ${escapeHtml(row.payload.phone || "Belirtilmedi")}</p>
      <p style="color:#555;line-height:1.65;"><strong>Konu:</strong> ${escapeHtml(row.payload.contact_subject || "Genel İletişim")}</p>
      ${row.payload.order_no ? `<p style="color:#555;line-height:1.65;"><strong>Sipariş No:</strong> ${escapeHtml(row.payload.order_no)}</p>` : ""}
      <div style="margin-top:20px;padding:18px;border-radius:12px;background:#f7f8fa;border:1px solid #e8ebf0;white-space:pre-wrap;color:#172033;line-height:1.65;">${escapeHtml(row.payload.message)}</div>
      <p style="margin-top:20px;color:#777;font-size:13px;">Yanıtlamak için admin panelindeki İletişim bölümünü kullanabilirsiniz.</p>
    `
  } else if (row.type === "customer_registered_admin") {
    innerHtml = `
      <h2 style="color:#172033;margin:0 0 18px;">Yeni müşteri kaydı</h2>
      <p style="color:#555;line-height:1.65;"><strong>Müşteri:</strong> ${escapeHtml(row.payload.name || "Belirtilmedi")}</p>
      <p style="color:#555;line-height:1.65;"><strong>E-posta:</strong> ${escapeHtml(row.payload.email)}</p>
      <p style="color:#555;line-height:1.65;"><strong>Telefon:</strong> ${escapeHtml(row.payload.phone || "Belirtilmedi")}</p>
      <p style="color:#777;font-size:13px;line-height:1.6;">Yeni müşteri hesabını admin panelindeki Kullanıcılar bölümünden inceleyebilirsiniz.</p>
    `
  } else if (row.type === "return_requested_admin") {
    innerHtml = `
      <h2 style="color:#172033;margin:0 0 18px;">Yeni iade talebi</h2>
      <p style="color:#555;line-height:1.65;"><strong>Sipariş No:</strong> ${escapeHtml(row.payload.order_id)}</p>
      <p style="color:#555;line-height:1.65;"><strong>Müşteri:</strong> ${escapeHtml(row.payload.email)}</p>
      <p style="color:#555;line-height:1.65;"><strong>Neden:</strong> ${escapeHtml(row.payload.reason)}</p>
      ${row.payload.note ? `<div style="margin-top:18px;padding:16px;border-radius:12px;background:#f7f8fa;color:#172033;line-height:1.6;white-space:pre-wrap;">${escapeHtml(row.payload.note)}</div>` : ""}
      <p style="color:#777;font-size:13px;line-height:1.6;">Talebi admin panelindeki İade Talepleri bölümünden inceleyebilirsiniz.</p>
    `
  } else if (row.type === "contact_message_received") {
    innerHtml = `
      <p style="margin:0 0 8px;color:${escapeHtml(brand.primaryColor)};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">İletişim talebiniz</p>
      <h2 style="color:#172033;margin:0 0 18px;font-size:26px;line-height:1.25;">Mesajınızı aldık</h2>
      <p style="color:#475467;line-height:1.7;margin:0 0 12px;">Merhaba ${escapeHtml(row.payload.name)},</p>
      <p style="color:#475467;line-height:1.7;margin:0;">Bizimle iletişime geçtiğiniz için teşekkür ederiz. “${escapeHtml(row.payload.contact_subject || "Genel İletişim")}” konulu talebiniz ekibimize ulaştı. Sizi en kısa sürede bilgilendireceğiz.</p>
      <div style="margin-top:22px;padding:16px 18px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;color:#344054;font-size:14px;line-height:1.65;">
        <div><strong style="color:#172033;">Konu:</strong> ${escapeHtml(row.payload.contact_subject || "Genel İletişim")}</div>
        ${row.payload.order_no ? `<div style="margin-top:7px;"><strong style="color:#172033;">Sipariş No:</strong> ${escapeHtml(row.payload.order_no)}</div>` : ""}
      </div>
      <div style="margin-top:14px;padding:18px;border-radius:10px;background:#ffffff;border:1px solid #e5e7eb;border-left:4px solid ${escapeHtml(brand.primaryColor)};white-space:pre-wrap;color:#344054;line-height:1.7;">${escapeHtml(row.payload.message)}</div>
      <p style="color:#475467;line-height:1.7;margin:22px 0 0;">Saygılarımızla,<br><strong style="color:#172033;">${escapeHtml(brand.brandName)} Müşteri Deneyimi Ekibi</strong></p>
    `
  } else if (row.type === "contact_reply_customer" || row.type === "contact_reply_admin") {
    innerHtml = `
      <p style="margin:0 0 8px;color:${escapeHtml(brand.primaryColor)};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Müşteri destek ekibi</p>
      <h2 style="color:#172033;margin:0 0 18px;font-size:26px;line-height:1.25;">${row.payload.initiated_by_admin ? "ZK Home’dan yeni mesajınız var" : "Talebiniz yanıtlandı"}</h2>
      <p style="color:#475467;line-height:1.7;margin:0 0 12px;">Merhaba ${escapeHtml(row.payload.name || "Değerli Müşterimiz")},</p>
      <p style="color:#475467;line-height:1.7;margin:0;">${row.payload.initiated_by_admin ? "Ekibimizin sizin için ilettiği mesajı aşağıda bulabilirsiniz." : "Bizimle iletişime geçtiğiniz için teşekkür ederiz. Ekibimizin yanıtını aşağıda bulabilirsiniz."}</p>
      <div style="margin-top:22px;padding:15px 18px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;color:#344054;font-size:14px;line-height:1.65;">
        <div><strong style="color:#172033;">Konu:</strong> ${escapeHtml(row.payload.contact_subject || "İletişim Talebi")}</div>
        ${row.payload.order_no ? `<div style="margin-top:7px;"><strong style="color:#172033;">Sipariş No:</strong> ${escapeHtml(row.payload.order_no)}</div>` : ""}
      </div>
      <div style="margin-top:14px;padding:20px 20px 20px 22px;border-radius:10px;background:#ffffff;border:1px solid #e5e7eb;border-left:4px solid ${escapeHtml(brand.primaryColor)};color:#172033;line-height:1.75;white-space:pre-wrap;"><strong style="display:block;margin-bottom:10px;color:${escapeHtml(brand.primaryColor)};font-size:13px;">${escapeHtml(brand.brandName)} yanıtı</strong>${escapeHtml(row.payload.reply)}</div>
      ${row.payload.initiated_by_admin ? "" : `<div style="margin-top:14px;padding:16px 18px;border-radius:10px;background:#f8fafc;border:1px solid #eef0f3;color:#667085;font-size:13px;line-height:1.65;white-space:pre-wrap;"><strong style="display:block;margin-bottom:7px;color:#475467;">Gönderdiğiniz mesaj</strong>${escapeHtml(row.payload.message)}</div>`}
      <p style="color:#475467;line-height:1.7;margin:22px 0 0;">Başka bir konuda desteğe ihtiyaç duyarsanız bize dilediğiniz zaman ulaşabilirsiniz.</p>
      <p style="color:#475467;line-height:1.7;margin:16px 0 0;">Saygılarımızla,<br><strong style="color:#172033;">${escapeHtml(brand.brandName)} Müşteri Deneyimi Ekibi</strong></p>
    `
  } else {
    const orderId = escapeHtml(row.payload.order_id)
    innerHtml = `
      <h2 style="color: #333; margin-bottom: 20px;">Siparişiniz alındı</h2>
      <p style="color: #555; line-height: 1.6;"><strong>Sipariş No:</strong> ${orderId}</p>
      <p style="color: #555; line-height: 1.6;">Ödemeniz kontrol edildikten sonra hazırlık süreci başlayacaktır.</p>
    `
  }

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;background:#f4f6f8;padding:32px 18px;">
      <div style="height:5px;background:${escapeHtml(brand.primaryColor)};border-radius:16px 16px 0 0;"></div>
      <div style="background:#ffffff;border:1px solid #e7e9ee;border-top:0;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,.08);">
        <div style="padding:30px 34px;text-align:center;border-bottom:1px solid #eceff3;background:#ffffff;">
          <a href="${escapeHtml(brand.websiteUrl)}" style="display:inline-block;text-decoration:none;">
            <img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.brandName)}" style="display:block;max-width:255px;max-height:72px;width:auto;height:auto;margin:0 auto;" />
          </a>
        </div>
        <div style="padding:34px;">
          ${innerHtml}
        </div>
        <div style="background:${escapeHtml(brand.primaryColor)};padding:24px 28px;text-align:center;font-size:12px;color:#ffffff;">
          <p style="margin:0;line-height:1.6;font-weight:600;">${escapeHtml(brand.brandName)} · Profesyonel destek, güvenilir hizmet</p>
          <p style="margin:7px 0 0;line-height:1.6;color:rgba(255,255,255,.9);">© ${new Date().getFullYear()} ${escapeHtml(brand.companyName)}. Tüm hakları saklıdır.</p>
          <p style="margin:7px 0 0;"><a href="mailto:${escapeHtml(brand.contactEmail)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml(brand.contactEmail)}</a></p>
        </div>
      </div>
    </div>
  `
}

export async function processNotificationOutbox(
  limit = 10,
  notificationIds?: string[],
): Promise<OutboxProcessResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.TRANSACTIONAL_EMAIL_FROM
  const replyTo = process.env.TRANSACTIONAL_EMAIL_REPLY_TO
  const brand = await getEmailBrandSettings()
  const ids = notificationIds?.filter(Boolean) || []
  const scopedQuery = ids.length > 0
  const params: unknown[] = [Math.min(Math.max(limit, 1), 25)]
  if (scopedQuery) params.push(ids)

  const rows = await query<OutboxRow>(
    `SELECT id,type,recipient,subject,payload,attempts
     FROM notification_outbox
     WHERE status IN ('pending','failed') AND attempts < 5
       ${scopedQuery ? "AND id = ANY($2::text[])" : ""}
     ORDER BY created_at
     LIMIT $1`,
    params,
  )
  let sent = 0
  let configured = Boolean(apiKey && from)

  for (const row of rows) {
    const claimed = await query<{ id: string }>(
      `UPDATE notification_outbox
       SET status='processing',attempts=attempts+1,updated_at=NOW()
       WHERE id=$1 AND status IN ('pending','failed') AND attempts < 5
       RETURNING id`,
      [row.id]
    )
    if (!claimed[0]) continue
    try {
      const brandedSubject = row.subject.replaceAll("ZK Home", brand.brandName)
      const adminCopy =
        ADMIN_COPY_TYPES.has(row.type)
          ? brand.adminEmails.filter((email) => email !== row.recipient.toLowerCase())
          : []
      if (apiKey && from && !row.type.startsWith("contact_")) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": row.id,
            "User-Agent": "zkhome-store/1.0",
          },
          body: JSON.stringify({
            from,
            to: [row.recipient],
            subject: brandedSubject,
            html: emailHtml(row, brand),
            ...(adminCopy.length ? { bcc: adminCopy } : {}),
            ...(String(row.payload.reply_to || brand.replyTo || replyTo)
              ? { reply_to: String(row.payload.reply_to || brand.replyTo || replyTo) }
              : {}),
          }),
        })
        if (!response.ok) {
          throw new Error(`E-posta sağlayıcısı HTTP ${response.status}`)
        }
      } else {
        const result = await sendSmtpEmail({
          to: row.recipient,
          subject: brandedSubject,
          html: emailHtml(row, brand),
          messageId: `<${row.id}@zk-home.com>`,
          replyTo: String(row.payload.reply_to || brand.replyTo || replyTo || ""),
          bcc: adminCopy.length ? adminCopy : undefined,
        })
        if (!result.configured) {
          throw new Error(EMAIL_PROVIDER_NOT_CONFIGURED)
        }
        if (!result.receipt?.accepted.some(address => address.toLowerCase() === row.recipient.toLowerCase())) {
          throw new Error("Alıcı adresi SMTP sunucusu tarafından kabul edilmedi.")
        }
        await query(`UPDATE notification_outbox SET payload=payload || $2::jsonb WHERE id=$1`,
          [row.id, JSON.stringify({ delivery_receipt: result.receipt })])
        configured = true
      }
      await query(
        `UPDATE notification_outbox
         SET status='sent',sent_at=NOW(),last_error=NULL,updated_at=NOW()
         WHERE id=$1`,
        [row.id]
      )
      sent += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata"
      const providerMissing = message === EMAIL_PROVIDER_NOT_CONFIGURED
      await query(
        `UPDATE notification_outbox
         SET status=$2,
             attempts=CASE WHEN $2='pending' THEN GREATEST(attempts-1,0) ELSE attempts END,
             last_error=$3,
             updated_at=NOW()
         WHERE id=$1`,
        [row.id, providerMissing ? "pending" : "failed", message]
      )
    }
  }
  return {
    processed: rows.length,
    sent,
    configured,
  }
}
