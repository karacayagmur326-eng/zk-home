import "server-only"
import { ensureCommerceSchema } from "./schema"
import { query } from "@lib/admin/db"

let ready: Promise<void> | undefined

export function ensureProductQuestions(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await ensureCommerceSchema()
      try {
        await query("SELECT answered_at, answer_version FROM product_reviews LIMIT 0")
      } catch (error) {
        if ((error as { code?: string }).code !== "42703") throw error
        // Production skips the full bootstrap; upgrade only question reply fields.
        await query(`ALTER TABLE product_reviews
          ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS answer_version INTEGER NOT NULL DEFAULT 0`)
      }
    })().catch(error => {
      ready = undefined
      throw error
    })
  }
  return ready
}
