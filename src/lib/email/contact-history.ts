import "server-only"
import { query } from "@lib/admin/db"

let schemaReady: Promise<void> | null = null
export async function ensureContactHistory() {
  if (!schemaReady) schemaReady = initializeContactHistory().catch((error) => { schemaReady = null; throw error })
  return schemaReady
}

async function initializeContactHistory() {
  await query(`CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
    phone TEXT, subject TEXT, order_no TEXT, message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS order_no TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS customer_id TEXT,
    ADD COLUMN IF NOT EXISTS admin_reply TEXT,
    ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS initiated_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS admin_message_key TEXT,
    ADD COLUMN IF NOT EXISTS product_question_id BIGINT,
    ADD COLUMN IF NOT EXISTS product_review_id BIGINT,
    ADD COLUMN IF NOT EXISTS source_kind TEXT NOT NULL DEFAULT 'contact';
  CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_review_idx ON contact_messages(product_review_id) WHERE product_review_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_question_idx ON contact_messages(product_question_id) WHERE product_question_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_admin_key_idx ON contact_messages(admin_message_key) WHERE admin_message_key IS NOT NULL;
  CREATE INDEX IF NOT EXISTS contact_messages_customer_idx ON contact_messages(customer_id);
  CREATE INDEX IF NOT EXISTS contact_messages_email_idx ON contact_messages(LOWER(email));`)
  await query(`CREATE TABLE IF NOT EXISTS contact_incoming_replies (
    id TEXT PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS contact_incoming_replies_contact_idx ON contact_incoming_replies(contact_id,created_at)`)
}

export async function contactHistory(id: string) {
  await ensureContactHistory()
  return query(`
    SELECT 'original_' || id AS id, 'incoming' AS direction, email AS sender,
      message AS body, created_at, 'received' AS delivery_status, NULL AS sent_at
    FROM contact_messages WHERE id=$1 AND NOT initiated_by_admin
    UNION ALL
    SELECT id, 'outgoing', 'Mağaza', COALESCE(payload->>'reply',payload->>'answer'), created_at,
      CASE WHEN payload->>'receipt_reply_id' IS NOT NULL THEN 'delivered' ELSE status END, sent_at
    FROM notification_outbox
    WHERE type IN ('contact_reply_customer','product_question_answered') AND payload->>'message_id'=$1::text
    UNION ALL
    SELECT id, 'incoming', sender, message, created_at, 'received', NULL
    FROM contact_incoming_replies WHERE contact_id=$1
    UNION ALL
    SELECT 'legacy_' || id, 'outgoing', 'Mağaza', admin_reply,
      COALESCE(replied_at,created_at), 'unknown', NULL
    FROM contact_messages m WHERE id=$1 AND admin_reply IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM notification_outbox n
        WHERE n.type IN ('contact_reply_customer','product_question_answered') AND n.payload->>'message_id'=m.id::text)
    ORDER BY created_at, id`, [String(id)])
}
