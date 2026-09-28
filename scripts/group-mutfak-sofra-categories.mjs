/** Group the existing Mutfak & Sofra categories without changing their public URLs. */
import fs from "node:fs"
import pg from "pg"

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
)
if (!env.DATABASE_URL) throw new Error("DATABASE_URL gerekli")

const rootHandle = "mutfak-sofra"
const groups = [
  {
    name: "Sofra Takımları",
    slug: "sofra-takimlari",
    description: "Yemek ve kahvaltı takımları, bardaklar ve servis parçalarıyla günlük sofralar ve özel davetler için seçenekleri keşfedin.",
    image: "/category-icons/yemek-takimlari.svg",
    children: ["yemek-takimlari", "kahvalti-takimlari", "bardak-kadeh", "servis-sunum", "tepsiler"],
  },
  {
    name: "Kahve & İçecek",
    slug: "kahve-icecek",
    description: "Kahve ve çay fincanları, kupalar, kahve yanı bardakları, sürahi ve karaf modellerini bir arada inceleyin.",
    image: "/category-icons/kahve-fincanlari.svg",
    children: ["kahve-fincanlari", "cay-fincanlari", "kupalar", "kahve-yani-bardaklari", "surahi-karaf"],
  },
  {
    name: "Mutfak & Saklama",
    slug: "mutfak-saklama",
    description: "Kavanoz ve saklama çözümleriyle mutfağınızı düzenleyin; dondurmalık seçeneklerini keşfedin.",
    image: "/category-icons/mutfak-saklama.svg",
    children: ["kavanoz-saklama", "dondurmalik"],
  },
]

const db = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(env.DATABASE_URL) ? false : { rejectUnauthorized: false },
})

try {
  await db.connect()
  await db.query("BEGIN")
  const rootRows = await db.query("SELECT id FROM store_category WHERE handle=$1 FOR UPDATE", [rootHandle])
  if (rootRows.rowCount !== 1) throw new Error("Mutfak & Sofra ana kategorisi bulunamadı")
  const rootId = rootRows.rows[0].id
  const allSlugs = groups.flatMap((group) => group.children)
  const leafRows = await db.query(
    "SELECT id, handle FROM store_category WHERE handle = ANY($1::text[]) FOR UPDATE",
    [allSlugs.map((slug) => `${rootHandle}/${slug}`)],
  )
  const leaves = new Map(leafRows.rows.map((row) => [row.handle, row.id]))
  const missing = allSlugs.filter((slug) => !leaves.has(`${rootHandle}/${slug}`))
  if (missing.length) throw new Error(`Alt kategoriler eksik: ${missing.join(", ")}`)

  for (const [groupRank, group] of groups.entries()) {
    const id = `pcat_zk_mutfak_sofra_${group.slug.replaceAll("-", "_")}`
    const handle = `${rootHandle}/${group.slug}`
    const metadata = {
      pretty_url: true,
      is_indexable: true,
      card_title: group.name,
      card_description: group.description,
      card_image_url: group.image,
      icon: group.image,
      seo_title: `${group.name} Modelleri | ZK Home`,
      seo_description: group.description,
      child_card_columns: 3,
    }
    await db.query(
      `INSERT INTO store_category (id,name,handle,description,parent_id,rank,active,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [id, group.name, handle, group.description, rootId, groupRank, JSON.stringify(metadata)],
    )
    const actual = await db.query("SELECT id,parent_id FROM store_category WHERE handle=$1", [handle])
    if (actual.rowCount !== 1 || actual.rows[0].parent_id !== rootId) {
      throw new Error(`${group.name} kategorisi beklenen konumda değil`)
    }
    if (group.slug === "mutfak-saklama") {
      await db.query(
        `UPDATE store_category
         SET metadata = jsonb_set(jsonb_set(metadata, '{card_image_url}', $2::jsonb), '{icon}', $2::jsonb),
             updated_at = NOW()
         WHERE id=$1 AND metadata->>'card_image_url'='/category-icons/mutfak-sofra.svg'`,
        [actual.rows[0].id, JSON.stringify(group.image)],
      )
    }
    for (const [rank, slug] of group.children.entries()) {
      await db.query(
        "UPDATE store_category SET parent_id=$1, rank=$2, updated_at=NOW() WHERE id=$3",
        [actual.rows[0].id, rank, leaves.get(`${rootHandle}/${slug}`)],
      )
    }
  }
  await db.query("COMMIT")
  console.log("Mutfak & Sofra: 3 grup ve 12 alt kategori düzenlendi; mevcut alt kategori URL'leri korundu.")
} catch (error) {
  await db.query("ROLLBACK").catch(() => {})
  throw error
} finally {
  await db.end()
}
