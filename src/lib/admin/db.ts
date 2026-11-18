import { Pool, PoolClient } from "pg"
import { getCached, clearMemoryCache, invalidateTables } from "@lib/cache"
import { shouldInvalidateCatalog, mutationTables, readTables } from "@lib/cache-mutation"

const CONFIGURED_DATABASE_URL = process.env.ZK_SUPABASE_POSTGRES_URL || process.env.DATABASE_URL
const DATABASE_URL =
  CONFIGURED_DATABASE_URL ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "postgres://postgres:postgres@localhost:5432/zkhome")

declare global {
  var _pgPool: Pool | undefined;
}

export function getDb() {
  if (!DATABASE_URL) {
    throw new Error(
      "Üretim veritabanı bağlantısı yapılandırılmamış. DATABASE_URL zorunludur."
    )
  }
  if (!global._pgPool) {
    const isLocal =
      DATABASE_URL.includes("localhost") ||
      DATABASE_URL.includes("127.0.0.1")
    const configuredPoolSize = Number.parseInt(process.env.DATABASE_POOL_MAX || "", 10)
    const poolSize = Number.isFinite(configuredPoolSize) && configuredPoolSize > 0
      ? configuredPoolSize
      : isLocal ? 10 : 3
    const connectionUrl = new URL(DATABASE_URL)
    // pg's URL SSL options otherwise override the verified TLS configuration.
    for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) connectionUrl.searchParams.delete(key)
    global._pgPool = new Pool({
      connectionString: connectionUrl.toString(),
      ssl: isLocal ? false : {
        rejectUnauthorized: true,
        ...(process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n") } : {}),
      },
      // Vercel gibi serverless ortamlarda her sıcak instance kendi havuzunu açar.
      // Sınırlı paralel sorgular aynı sayfanın birbirini beklemesini önler.
      max: poolSize,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 5000,
    })
  }
  return global._pgPool
}

export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await getDb().query("SELECT 1")
    return true
  } catch {
    return false
  }
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const db = getDb()
    const result = await db.query(sql, params)
    
    if (shouldInvalidateCatalog(sql, result.rowCount)) {
      const tables = mutationTables(sql)
      if (tables.length && !/\bTRUNCATE\b/i.test(sql)) invalidateTables(tables)
      else clearMemoryCache()
    }

    return result.rows as T[]
  } catch (error: any) {
    if (error?.code === "ECONNREFUSED" || error?.message?.includes("ECONNREFUSED")) {
      console.warn("Veritabanı bağlantısı kurulamadı (PostgreSQL sunucusu aktif değil veya erişilemiyor).")
      throw error
    }
    throw error
  }
}

export async function cachedQuery<T = Record<string, unknown>>(
  cacheKey: string,
  sql: string,
  params: unknown[] = [],
  ttlSeconds: number = 300
): Promise<T[]> {
  return getCached<T[]>(
    cacheKey,
    async () => {
      const db = getDb()
      const result = await db.query(sql, params)
      return result.rows as T[]
    },
    ttlSeconds,
    readTables(sql),
  )
}

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
  options: { invalidateCatalog?: boolean } = {}
): Promise<T> {
  const client = await getDb().connect()
  const changed = new Set<string>()
  let unknownMutation = false
  // Track actual writes, including no-op/rollback behavior, rather than flush
  // every public page whenever a private transaction successfully commits.
  const tracked = options.invalidateCatalog === false ? client : new Proxy(client, {
    get(target, property) {
      if (property !== "query") {
        const value = Reflect.get(target, property, target)
        return typeof value === "function" ? value.bind(target) : value
      }
      return (...args: any[]) => {
        const sql = typeof args[0] === "string" ? args[0] : args[0]?.text || ""
        const track = (result: any) => {
          const results = Array.isArray(result) ? result : [result]
          if (results.some(item => shouldInvalidateCatalog(sql, item?.rowCount ?? null))) {
            const tables = mutationTables(sql)
            if (!tables.length || /\bTRUNCATE\b/i.test(sql)) unknownMutation = true
            tables.forEach(table => changed.add(table))
          }
          return result
        }
        const result = (target.query as (...input: any[]) => any).apply(target, args)
        if (result && typeof result.then === "function") return result.then(track)
        // Non-promise pg overloads are not used by our transactions; retain
        // conservative invalidation if one is introduced later.
        if (shouldInvalidateCatalog(sql, null)) unknownMutation = true
        return result
      }
    },
  })
  try {
    await client.query("BEGIN")
    const result = await work(tracked)
    await client.query("COMMIT")
    if (options.invalidateCatalog !== false) {
      if (unknownMutation) clearMemoryCache()
      else invalidateTables([...changed])
    }
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
