/** Apply the new three-column subcategory layout to existing parent categories. */
import fs from "node:fs"
import pg from "pg"

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("="))
  .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]))
if (!env.DATABASE_URL) throw new Error("DATABASE_URL gerekli")

const db = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(env.DATABASE_URL) ? false : { rejectUnauthorized: false },
})

try {
  await db.connect()
  const result = await db.query(`
    UPDATE store_category parent
       SET metadata = jsonb_set(COALESCE(parent.metadata, '{}'::jsonb), '{child_card_columns}', '3'::jsonb, true),
           updated_at = NOW()
     WHERE EXISTS (SELECT 1 FROM store_category child WHERE child.parent_id = parent.id AND child.active = TRUE)
       AND COALESCE(parent.metadata->>'child_card_columns', '') <> '3'
  `)
  console.log(`${result.rowCount} kategori için alt kategori kartları üç sütuna ayarlandı.`)
} finally {
  await db.end()
}
