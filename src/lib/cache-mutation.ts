const operationalTables = new Set([
  "store_cart", "store_cart_item", "api_rate_limits", "notification_outbox",
  "customer_notification_read", "store_customer_favorite", "store_customer",
  "store_customer_address", "store_customer_token",
])

export function shouldInvalidateCatalog(sql: string, rowCount: number | null): boolean {
  if (rowCount === 0 || !/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE)\b/i.test(sql)) return false
  if (/\b(?:ALTER|DROP|TRUNCATE)\s+(?:TABLE\s+)?/i.test(sql)) return true
  // ON CONFLICT DO UPDATE SET is an upsert clause, not an UPDATE of a table
  // named "set". Treating it as one invalidated every cache on rate-limit hits.
  const tables = [...sql.matchAll(/\b(?:INSERT\s+INTO|UPDATE(?!\s+SET\b)|DELETE\s+FROM)\s+([a-z_][a-z0-9_]*)\b/gi)]
    .map(match => match[1].toLowerCase())
  return !tables.length || tables.some(table => !operationalTables.has(table))
}
