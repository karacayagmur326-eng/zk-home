export function sliderRevealEnd(value: unknown): number {
  const percent = value == null ? 65 : Number(value)
  return Number.isFinite(percent) ? Math.max(5, Math.min(100, percent)) : 65
}
