/** Add the initial, admin-managed homepage slide without changing existing slides. */
import fs from "node:fs"
import pg from "pg"

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)])
)
if (!env.DATABASE_URL) throw new Error("DATABASE_URL gerekli")

const db = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(env.DATABASE_URL)
    ? false
    : { rejectUnauthorized: false },
})

try {
  await db.connect()
  await db.query(
    `UPDATE slider SET image_url=$1, updated_at=NOW()
     WHERE id=$2 AND image_url=$3 AND deleted_at IS NULL`,
    [
      "/hero/zkhome-panorama-v4.png",
      "slider_zk_home_editorial",
      "/hero/zkhome-panorama-v3.png",
    ],
  )
  const existing = await db.query("SELECT count(*)::int AS count FROM slider")
  if (existing.rows[0].count > 0) {
    console.log("Mevcut slaytlar korundu; başlangıç slaytı eklenmedi.")
  } else {
    await db.query(
      `INSERT INTO slider (
        id, title, image_url, heading, subheading, badge_text, bg_color,
        button_text, button_link, button_color, button2_text, button2_link,
        button2_color, text_color, features, right_features, is_active, order_index
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, TRUE, 0
      ) ON CONFLICT (id) DO NOTHING`,
      [
        "slider_zk_home_editorial",
        "ZK Home Ana Sayfa",
        "/hero/zkhome-panorama-v4.png",
        "Evinize **İyi Gelen** Dokunuşlar",
        "Dekorasyon, sofra ve ev tekstili için ilham veren kategorileri keşfedin.",
        "ZK Home",
        "#F7EFED",
        "Dekorasyonu Keşfet",
        "/dekorasyon",
        "#C98484",
        "Mutfak & Sofra",
        "/mutfak-sofra",
        "#1A1A1A",
        "#312727",
        "[]",
        "[]",
      ],
    )
    console.log("Yönetilebilir ana sayfa slaytı eklendi.")
  }
} finally {
  await db.end()
}
