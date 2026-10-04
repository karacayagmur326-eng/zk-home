import "server-only"
import { ImapFlow } from "imapflow"
import { simpleParser } from "mailparser"
import { query, withTransaction } from "@lib/admin/db"
import { decryptSettings } from "@lib/security/encrypted-settings"
import { ensureContactHistory } from "./contact-history"
import { createHash } from "crypto"

export async function syncContactInbox() {
  await ensureContactHistory()
  const [row] = await query<{ value: Record<string, any> }>(
    "SELECT value FROM store_settings WHERE key='smtp_settings' LIMIT 1")
  const settings = row?.value || {}
  const password = decryptSettings(settings.encrypted_pass).pass || settings.pass
  if (!settings.host || !settings.user || !password) throw new Error("Posta kutusu bağlantı bilgileri eksik.")
  const client = new ImapFlow({
    host: process.env.CONTACT_IMAP_HOST || settings.host,
    port: 993, secure: true,
    auth: { user: settings.user, pass: password },
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
    logger: false, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  })
  let imported = 0
  let skipped = 0
  const started = Date.now()
  try {
    await client.connect()
    await client.mailboxOpen("INBOX", { readOnly: true })
    const mailbox = client.mailbox
    if (!mailbox || !mailbox.exists) return { imported, skipped }
    // Bounded read, including already-read emails. Reading does not set Seen.
    const envelopes = []
    for await (const item of client.fetch(`${Math.max(1,mailbox.exists-199)}:*`, { envelope: true, size: true, internalDate: true, uid: true })) {
      envelopes.push(item)
    }
    for (const item of envelopes) {
      if (Date.now() - started > 40000) break
      const sender = item.envelope?.from?.[0]?.address?.toLowerCase()
      if (!sender || sender === String(settings.user).toLowerCase() || (item.size || 0) > 2_000_000) { skipped++; continue }
      const candidates = await query<{ id: string; subject: string }>(
        "SELECT id,subject FROM contact_messages WHERE LOWER(email)=$1", [sender])
      if (!candidates.length) continue
      const source = await client.fetchOne(String(item.uid), { source: true }, { uid: true })
      if (!source || !source.source) continue
      const mail = await simpleParser(source.source, { skipHtmlToText: false, skipTextToHtml: true, skipImageLinks: true })
      const references = [mail.inReplyTo, ...(Array.isArray(mail.references) ? mail.references : [mail.references])].filter(Boolean).join(" ")
      const ids = [...references.matchAll(/<(notif_contact_[^<>]+)@zk-home\.com>/g)].map(match=>match[1])
      const linked = ids.length ? await query<{ contact_id: string }>(
        "SELECT DISTINCT payload->>'message_id' AS contact_id FROM notification_outbox WHERE id=ANY($1::text[])", [ids]) : []
      const marker = mail.subject?.match(/(?:\[ZK Talep #|ZK HOME #)(\d+)(?:\]|\s+Talep)/i)?.[1]
      const matching = candidates.filter(candidate => linked.some(link=>String(link.contact_id)===String(candidate.id)) || String(candidate.id)===marker)
      // Legacy mail can only be linked by a unique, explicit subject; never by sender alone.
      const normalizedSubject = (mail.subject || "").replace(/^(?:(?:re|fw|fwd|ynt|yanıt)\s*:\s*)+/i, "").trim()
      const sentSubjects = await query<{ contact_id: string }>(
        `SELECT DISTINCT payload->>'message_id' AS contact_id FROM notification_outbox
         WHERE type IN ('contact_reply_customer','contact_message_received')
         AND LOWER(recipient)=$1 AND subject=$2 AND created_at <= $3`,
        [sender, normalizedSubject, item.internalDate || new Date()])
      const legacy = candidates.filter(candidate => candidate.subject === normalizedSubject || sentSubjects.some(sent=>String(sent.contact_id)===String(candidate.id)))
      const contact = matching.length === 1 ? matching[0] : !matching.length && legacy.length === 1 ? legacy[0] : null
      if (!contact || !mail.text?.trim()) { skipped++; continue }
      const key = createHash("sha256").update(`${settings.user}:${mail.messageId || source.source.toString('base64')}`).digest("hex")
      const added = await withTransaction(async db => {
        const result = await db.query(`INSERT INTO contact_incoming_replies (id,contact_id,sender,message,created_at)
          VALUES ($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING RETURNING id`,
          [key,contact.id,sender,mail.text!.trim().slice(0,50000),item.internalDate || new Date()])
        if (result.rowCount) await db.query("UPDATE contact_messages SET status='new' WHERE id=$1", [contact.id])
        // Only a reply referencing this exact outgoing email confirms customer receipt.
        if (ids.length) await db.query(`UPDATE notification_outbox
          SET payload=payload || jsonb_build_object('receipt_reply_id',$4::text)
          WHERE id=ANY($1::text[]) AND type='contact_reply_customer'
            AND payload->>'message_id'=$2::text AND LOWER(recipient)=$3 AND status='sent'`,
          [ids,String(contact.id),sender,key])
        return result.rowCount || 0
      })
      imported += added
    }
    return { imported, skipped }
  } finally {
    if (client.usable) await client.logout().catch(()=>client.close())
    else client.close()
  }
}
