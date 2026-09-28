/** Publish the initial FAQ once while preserving any existing admin content. */
import fs from "node:fs"
import pg from "pg"

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)])
)
if (!env.DATABASE_URL) throw new Error("DATABASE_URL gerekli")

const source = JSON.parse(fs.readFileSync(new URL("../src/lib/content/faq-data.json", import.meta.url), "utf8"))
const categories = source.categories.map((category, index) => ({
  id: category.id, title: category.title, icon: category.icon, sort_order: index + 1,
}))
const items = source.categories.flatMap((category) =>
  category.questions.map(([question, answer], index) => ({
    id: `${category.id}-${String(index + 1).padStart(2, "0")}`,
    category_id: category.id, question, answer,
    linkUrl: category.linkUrl, linkText: category.linkText,
    sort_order: 0, active: true,
  }))
).map((item, index) => ({ ...item, sort_order: index + 1 }))
if (items.length !== 100) throw new Error(`100 soru bekleniyordu; ${items.length} bulundu`)

const db = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(env.DATABASE_URL) ? false : { rejectUnauthorized: false },
})

try {
  await db.connect()
  await db.query("BEGIN")
  await db.query(`CREATE TABLE IF NOT EXISTS content_pages (
    handle TEXT PRIMARY KEY, content JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await db.query(`INSERT INTO content_pages (handle, content) VALUES ('sss', '{}'::jsonb)
    ON CONFLICT (handle) DO NOTHING`)
  const result = await db.query("SELECT content FROM content_pages WHERE handle = 'sss' FOR UPDATE")
  const current = result.rows[0].content || {}
  if (current.faq_seed_version === 1) {
    console.log("SSS başlangıç içeriği daha önce eklendi; yönetici değişiklikleri korundu.")
  } else {
    const currentCategories = Array.isArray(current.faq_categories) ? current.faq_categories : []
    const currentItems = Array.isArray(current.faq_items) ? current.faq_items : []
    const categoryIds = new Set(currentCategories.map((category) => category.id))
    const itemIds = new Set(currentItems.map((item) => item.id))
    const merged = {
      ...current,
      title: !current.title || current.title === "Sık Sorulan Sorular" ? "Sıkça Sorulan Sorular" : current.title,
      description: !current.description || current.description.includes("yönetim panelinden oluşturulacaktır")
        ? "Yemek takımları, ev dekorasyonu, nevresim, banyo ürünleri ve sipariş süreçleri hakkında sık sorulan soruların yanıtları."
        : current.description,
      hero_text: !current.hero_text || current.hero_text.includes("yakında")
        ? "Sofra, dekorasyon, ev tekstili ve alışveriş hakkında merak ettiklerinizi keşfedin."
        : current.hero_text,
      faq_categories: [...currentCategories, ...categories.filter((category) => !categoryIds.has(category.id))],
      faq_items: [...currentItems, ...items.filter((item) => !itemIds.has(item.id))],
      faq_seed_version: 1,
    }
    await db.query("UPDATE content_pages SET content = $1::jsonb, updated_at = NOW() WHERE handle = 'sss'", [JSON.stringify(merged)])
    console.log(`SSS yayımlandı: ${merged.faq_categories.length} kategori, ${merged.faq_items.length} soru.`)
  }
  await db.query("COMMIT")
} catch (error) {
  await db.query("ROLLBACK")
  throw error
} finally {
  await db.end()
}
