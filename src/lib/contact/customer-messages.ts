import "server-only"
import { randomUUID } from "crypto"
import { query, withTransaction } from "@lib/admin/db"
import { getCustomerSessionId } from "@lib/commerce/customer-auth"
import { ensureContactHistory, contactHistory } from "@lib/email/contact-history"

export type ContactCustomer = { id: string; email: string; email_verified: boolean }

export async function getContactCustomer(): Promise<ContactCustomer | null> {
  const id = await getCustomerSessionId()
  if (!id) return null
  const rows = await query<ContactCustomer>(
    "SELECT id,email,email_verified FROM store_customer WHERE id=$1 AND COALESCE(status,'Aktif')='Aktif' LIMIT 1", [id],
  )
  return rows[0] || null
}

const ownership = "(customer_id=$2 OR (customer_id IS NULL AND $4::boolean AND LOWER(email)=$3))"
const ownerValues = (id: string, customer: ContactCustomer) => [id, customer.id, customer.email.toLowerCase(), customer.email_verified === true]

export async function listCustomerMessages(customer: ContactCustomer) {
  await ensureContactHistory()
  return query(`SELECT id::text,subject,order_no,status,created_at,
    GREATEST(created_at,replied_at,(SELECT MAX(created_at) FROM contact_incoming_replies r WHERE r.contact_id=m.id)) AS updated_at
    FROM contact_messages m
    WHERE customer_id=$1 OR (customer_id IS NULL AND $3::boolean AND LOWER(email)=$2)
    ORDER BY updated_at DESC,id DESC`, [customer.id,customer.email.toLowerCase(),customer.email_verified === true])
}

export async function getCustomerMessage(customer: ContactCustomer, id: string) {
  await ensureContactHistory()
  const rows = await query<{ id: string; subject: string; order_no: string | null; status: string; created_at: string }>(
    `SELECT id::text,subject,order_no,status,created_at FROM contact_messages WHERE id=$1 AND ${ownership}`, ownerValues(id,customer),
  )
  if (!rows[0]) return null
  const history = await contactHistory(id)
  return { ...rows[0], history: history.map((entry) => ({
    id: entry.id, direction: entry.direction, body: entry.body, created_at: entry.created_at,
  })) }
}

export async function replyToCustomerMessage(customer: ContactCustomer, id: string, message: string) {
  await ensureContactHistory()
  return withTransaction(async (db) => {
    const owned = await db.query(`SELECT id FROM contact_messages WHERE id=$1 AND ${ownership} FOR UPDATE`, ownerValues(id,customer))
    if (!owned.rows[0]) return false
    await db.query(`INSERT INTO contact_incoming_replies (id,contact_id,sender,message,created_at)
      VALUES ($1,$2,$3,$4,NOW())`, [`portal_${randomUUID()}`,id,customer.email,message])
    await db.query("UPDATE contact_messages SET status='new',customer_id=COALESCE(customer_id,$2) WHERE id=$1", [id,customer.id])
    return true
  }, { invalidateCatalog: false })
}
