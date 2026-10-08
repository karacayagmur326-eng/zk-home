import "server-only"
import { query } from "@lib/admin/db"
import { decryptSettings } from "@lib/security/encrypted-settings"

export async function isBirFaturaReady(): Promise<boolean> {
  const rows = await query<{ enabled: boolean; encrypted_config: string | null }>(
    "SELECT enabled,encrypted_config FROM store_integration WHERE provider='birfatura' ORDER BY updated_at DESC LIMIT 1"
  )
  if (!rows.length) return Boolean(process.env.BIRFATURA_API_TOKEN?.trim())
  if (!rows[0].enabled) return false
  const secrets = decryptSettings(rows[0].encrypted_config)
  return Boolean(String(secrets.api_key || secrets.secret_key || secrets.password || "").trim())
}
