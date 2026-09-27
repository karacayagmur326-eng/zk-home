"use server"

import { query } from "@lib/admin/db"
import { normalizePublicImageUrl } from "@lib/security/public-assets"

export async function listActiveSliders(): Promise<any[]> {
  const rows = await query<any>(
    `SELECT * FROM slider
     WHERE deleted_at IS NULL AND is_active=TRUE
     ORDER BY order_index ASC, created_at DESC`,
  ).catch(() => [])
  return rows.map(({ image_url_light: legacyLightImage, ...slider }) => ({
    ...slider,
    image_url: normalizePublicImageUrl(legacyLightImage || slider.image_url, ""),
  }))
}
