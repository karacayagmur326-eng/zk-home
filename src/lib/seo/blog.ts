import { query } from "@lib/admin/db"
let ready: Promise<unknown> | undefined
export function ensureBlogSeoSchema() {
  if (!ready)
    ready = query(
      "ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_metadata JSONB NOT NULL DEFAULT '{}'::jsonb"
    ).catch((error) => {
      ready = undefined
      throw error
    })
  return ready
}
