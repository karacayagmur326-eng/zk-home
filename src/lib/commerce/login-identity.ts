import "server-only"
import { query } from "@lib/admin/db"

type LoginAccount = {
  id: string
  email: string
  username: string | null
  password_hash: string | null
  email_verified: boolean
  role: string | null
}

export async function findLoginAccount(identifier: string): Promise<LoginAccount | null> {
  const normalized = identifier.trim().toLowerCase()
  if (!normalized || normalized.length > 254) return null
  const rows = await query<LoginAccount>(
    `SELECT id,email,username,password_hash,email_verified,role
     FROM store_customer
     WHERE COALESCE(status,'Aktif')='Aktif' AND (
       ($2 AND LOWER(email)=$1) OR
       (NOT $2 AND (LOWER(username)=$1 OR
         (NULLIF(TRIM(username),'') IS NULL AND LOWER(SPLIT_PART(email,'@',1))=$1)))
     ) LIMIT 2`,
    [normalized, normalized.includes("@")]
  )
  // An ambiguous email prefix must never select an arbitrary account.
  return rows.length === 1 ? rows[0] : null
}
