/** Bound public listing input before it becomes a query or a cache key. */
export function productPagination(rawLimit: unknown = 12, rawPage: unknown = 1, rawOffset?: unknown) {
  const integer = (value: unknown, fallback: number, min: number, max: number) => {
    const number = Number(value)
    return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : fallback
  }
  const limit = integer(rawLimit, 12, 1, 500)
  const page = integer(rawPage, 1, 1, 1_000_000)
  const offset = integer(rawOffset ?? (page - 1) * limit, 0, 0, 1_000_000)
  return { limit, page, offset }
}
