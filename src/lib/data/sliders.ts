"use server"

import { query } from "@lib/admin/db"
import { normalizePublicImageUrl } from "@lib/security/public-assets"

const fallbackSlider = {
  id: "slider_zk_home_editorial",
  title: "ZK Home Ana Sayfa",
  image_url: "/hero/zkhome-panorama-v4.png",
  heading: "Evinize **İyi Gelen** Dokunuşlar",
  subheading: "Dekorasyon, sofra ve ev tekstili için ilham veren kategorileri keşfedin.",
  badge_text: "ZK Home",
  bg_color: "#F7EFED",
  button_text: "Dekorasyonu Keşfet",
  button_link: "/dekorasyon",
  button_color: "#C98484",
  button2_text: "Mutfak & Sofra",
  button2_link: "/mutfak-sofra",
  button2_color: "#1A1A1A",
  text_color: "#312727",
  features: [],
  right_features: [],
  is_active: true,
  order_index: 0,
}

export async function listActiveSliders(): Promise<any[]> {
  const rows = await query<any>(
    `SELECT * FROM slider
     WHERE deleted_at IS NULL AND is_active=TRUE
     ORDER BY order_index ASC, created_at DESC`,
  ).catch(() => null)
  if (!rows || (!rows.length && !process.env.DATABASE_URL)) {
    return [fallbackSlider]
  }
  return rows.map(({ image_url_light: legacyLightImage, ...slider }) => ({
    ...slider,
    image_url: normalizePublicImageUrl(legacyLightImage || slider.image_url, ""),
  }))
}
