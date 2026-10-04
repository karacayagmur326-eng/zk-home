import "server-only"
import { query } from "@lib/admin/db"

export async function ensureContactHistory() {
  await query(`CREATE TABLE IF NOT EXISTS contact_incoming_replies (
    id TEXT PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
}

export async function contactHistory(id: string) {
  await ensureContactHistory()
  return query(`
    SELECT 'original_' || id AS id, 'incoming' AS direction, email AS sender,
      message AS body, created_at, 'received' AS delivery_status, NULL AS sent_at
    FROM contact_messages WHERE id=$1
    UNION ALL
    SELECT id, 'outgoing', 'ZK HOME', payload->>'reply', created_at,
      CASE WHEN payload->>'receipt_reply_id' IS NOT NULL THEN 'delivered' ELSE status END, sent_at
    FROM notification_outbox
    WHERE type='contact_reply_customer' AND payload->>'message_id'=$1::text
    UNION ALL
    SELECT id, 'incoming', sender, message, created_at, 'received', NULL
    FROM contact_incoming_replies WHERE contact_id=$1
    UNION ALL
    SELECT 'legacy_' || id, 'outgoing', 'ZK Home', admin_reply,
      COALESCE(replied_at,created_at), 'unknown', NULL
    FROM contact_messages m WHERE id=$1 AND admin_reply IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM notification_outbox n
        WHERE n.type='contact_reply_customer' AND n.payload->>'message_id'=m.id::text)
    ORDER BY created_at, id`, [String(id)])
}
