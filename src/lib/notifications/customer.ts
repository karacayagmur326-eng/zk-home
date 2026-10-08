import "server-only"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { ensureContactHistory } from "@lib/email/contact-history"
import type { ContactCustomer } from "@lib/contact/customer-messages"

let ready: Promise<void> | null = null
async function ensureNotifications() {
  if (!ready) ready = (async () => {
    await ensureCommerceSchema()
    await ensureContactHistory()
    await query(`CREATE TABLE IF NOT EXISTS customer_notification_read (
      customer_id TEXT NOT NULL REFERENCES store_customer(id) ON DELETE CASCADE,
      notification_id TEXT NOT NULL,
      read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (customer_id,notification_id)
    )`)
  })().catch(error => { ready = null; throw error })
  return ready
}

// Ownership is checked against the contact, never against an email supplied by the client.
const feed = `WITH owned_contacts AS (
  SELECT * FROM contact_messages WHERE customer_id=$1
    OR (customer_id IS NULL AND $3::boolean AND LOWER(email)=$2)
), events AS (
  SELECT 'reply:' || n.id AS id, 'message' AS kind,
    CASE WHEN m.initiated_by_admin THEN 'ZK Home’dan yeni mesaj' ELSE 'Mesajınıza cevap verildi' END AS title,
    LEFT(COALESCE(n.payload->>'reply',''),240) AS body,
    '/hesabim/mesajlarim?talep=' || m.id AS href, n.created_at
  FROM notification_outbox n JOIN owned_contacts m ON n.payload->>'message_id'=m.id::text
  WHERE n.type='contact_reply_customer' AND n.payload->>'reply' IS NOT NULL
  UNION ALL
  SELECT 'reply:legacy:' || m.id, 'message', 'Mesajınıza cevap verildi',
    LEFT(m.admin_reply,240), '/hesabim/mesajlarim?talep=' || m.id, COALESCE(m.replied_at,m.created_at)
  FROM owned_contacts m WHERE m.admin_reply IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM notification_outbox n WHERE n.type='contact_reply_customer' AND n.payload->>'message_id'=m.id::text
  )
  UNION ALL
  SELECT 'campaign:' || id, 'campaign', name, LEFT(COALESCE(description,'Yeni kampanyamızı keşfedin.'),240),
    '/magaza', COALESCE(starts_at,created_at)
  FROM store_campaign WHERE status='active' AND metadata->>'customer_notification'='true'
    AND (starts_at IS NULL OR starts_at<=NOW()) AND (ends_at IS NULL OR ends_at>NOW())
  UNION ALL
  SELECT 'order:' || id || ':' || status || ':' || payment_status || ':' || fulfillment_status,
    'order', 'Siparişiniz güncellendi',
    '#' || display_id || ' numaralı siparişinizin güncel durumunu görüntüleyin.',
    '/hesabim/siparislerim/detaylar/' || id, COALESCE(updated_at,created_at)
  FROM store_order WHERE customer_id=$1
), notifications AS (
  SELECT e.*, r.read_at IS NOT NULL AS is_read FROM events e
  LEFT JOIN customer_notification_read r ON r.customer_id=$1 AND r.notification_id=e.id
)`

const values = (customer: ContactCustomer) => [customer.id, customer.email.toLowerCase(), customer.email_verified === true]
export async function customerNotifications(customer: ContactCustomer) {
  await ensureNotifications()
  const notifications = await query<{ id: string; kind: string; title: string; body: string; href: string; created_at: string; is_read: boolean; unread_count: number }>(
    `${feed} SELECT *, COUNT(*) FILTER (WHERE NOT is_read) OVER()::int AS unread_count
      FROM notifications ORDER BY created_at DESC,id DESC LIMIT 50`, values(customer),
  )
  return { notifications: notifications.map(({ unread_count, ...item }) => item), unreadCount: Number(notifications[0]?.unread_count || 0) }
}

export async function readCustomerNotifications(customer: ContactCustomer, ids: string[] | null) {
  await ensureNotifications()
  // Only events in this authenticated customer's feed can be marked read.
  await query(`${feed} INSERT INTO customer_notification_read (customer_id,notification_id)
    SELECT $1,id FROM notifications WHERE NOT is_read AND ($4::text[] IS NULL OR id=ANY($4))
    ON CONFLICT (customer_id,notification_id) DO NOTHING`, [...values(customer),ids])
}
