// Accept decimal dots or Turkish decimal commas without changing the text while typing.
export function parseMoneyInput(value: string): number | null {
  let normalized = value.trim().replace(/\s/g, "")
  if (!normalized) return null
  if (normalized.includes(",")) {
    if (!/^\d+(?:\.\d{3})*,\d{0,2}$/.test(normalized)) return null
    normalized = normalized.replace(/\./g, "").replace(",", ".")
  }
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(cents) && cents <= 10_000_000_000 ? cents : null
}
