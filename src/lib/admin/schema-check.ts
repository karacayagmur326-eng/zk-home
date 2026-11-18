import { getDb, query } from "./db"

const checks = new Map<string, Promise<void>>()

/** A normal read must not run DDL or invalidate cached storefront content.
 * Keep legacy installs compatible, but upgrade only missing schema features. */
export function ensureDatabaseFeature(key: string, probes: readonly string[], initialize: () => Promise<void>, indexes: readonly string[] = []) {
  const existing = checks.get(key)
  if (existing) return existing
  const check = (async () => {
    const probe = async () => { for (const sql of probes) await getDb().query(sql) }
    try {
      await probe()
      if (!indexes.length) return
      const found = await getDb().query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM pg_indexes WHERE schemaname=current_schema() AND indexname=ANY($1::text[])", [indexes],
      )
      if (found.rows[0]?.count === indexes.length) return
    } catch (error) {
      if (!["42P01", "42703"].includes((error as { code?: string }).code || "")) throw error
    }
    await initialize()
    await probe()
  })()
  checks.set(key, check)
  void check.catch(() => { if (checks.get(key) === check) checks.delete(key) })
  return check
}

export function ensureStoreSettingsSchema() {
  return ensureDatabaseFeature("store-settings-v1", ["SELECT key,value,updated_at FROM store_settings LIMIT 0"], async () => {
    await query(`CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`)
  })
}
