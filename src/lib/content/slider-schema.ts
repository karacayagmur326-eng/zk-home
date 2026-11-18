import { ensureDatabaseFeature } from "@lib/admin/schema-check"
import { query } from "@lib/admin/db"

export function ensureSliderSchema() {
  return ensureDatabaseFeature("slider-presentation-v1", [
    "SELECT image_reveal_end,image_reveal_enabled,image_reveal_settings,product_title,product_detail,product_url,theme FROM slider LIMIT 0",
  ], async () => {
    await query(`ALTER TABLE slider
      ADD COLUMN IF NOT EXISTS image_reveal_end INTEGER DEFAULT 65,
      ADD COLUMN IF NOT EXISTS image_reveal_enabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS image_reveal_settings JSONB,
      ADD COLUMN IF NOT EXISTS product_title TEXT,
      ADD COLUMN IF NOT EXISTS product_detail TEXT,
      ADD COLUMN IF NOT EXISTS product_url TEXT,
      ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'warm'`)
  })
}
