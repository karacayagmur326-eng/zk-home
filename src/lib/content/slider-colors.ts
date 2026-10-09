/** Slider zemin renginin yoğunluğu beyaz üzerine karıştırılarak uygulanır. */
export function sliderColorParts(value: string) {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value || "")
  return {
    color: match ? `#${match[1].toUpperCase()}` : value || "#FFFFFF",
    opacity: match?.[2] ? Math.round(parseInt(match[2], 16) / 255 * 100) : 100,
  }
}

export function withSliderOpacity(color: string, opacity: number) {
  const base = sliderColorParts(color).color
  const percent = Math.max(0, Math.min(100, Math.round(opacity)))
  return percent === 100 ? base : `${base}${Math.round(percent / 100 * 255).toString(16).padStart(2, "0").toUpperCase()}`
}

export function sliderColorOnWhite(value: string) {
  const { color, opacity } = sliderColorParts(value)
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color
  const ratio = opacity / 100
  return "#" + [1, 3, 5].map((index) => Math.round(parseInt(color.slice(index, index + 2), 16) * ratio + 255 * (1 - ratio)).toString(16).padStart(2, "0")).join("").toUpperCase()
}
