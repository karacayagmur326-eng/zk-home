import "server-only"

import { query } from "@lib/admin/db"

declare global {
  var _mediaTrashSchemaPromise: Promise<void> | null | undefined
}

/** Lightweight, independently versioned migration for the media trash feature. */
export function ensureMediaTrashSchema() {
  if (!global._mediaTrashSchemaPromise) {
    global._mediaTrashSchemaPromise = query(`
      ALTER TABLE store_media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS store_media_deleted_at_idx ON store_media(deleted_at);
    `)
      .then(() => undefined)
      .catch((error) => {
        global._mediaTrashSchemaPromise = null
        throw error
      })
  }
  return global._mediaTrashSchemaPromise
}
