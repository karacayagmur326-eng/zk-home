const blockedInlineImagePattern = /^(?:data|blob|javascript):/i

export function isSafePublicImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048 || blockedInlineImagePattern.test(trimmed)) {
    return false
  }
  return trimmed.startsWith("/") || /^https:\/\//i.test(trimmed)
}

export function normalizePublicImageUrl(
  value: unknown,
  fallback = ""
): string {
  return isSafePublicImageUrl(value) ? value.trim() : fallback
}
