export function sliderRevealEnd(value: unknown): number {
  const percent = value == null ? 65 : Number(value)
  return Number.isFinite(percent) ? Math.max(5, Math.min(100, percent)) : 65
}

export type SliderTransition = {
  start: number
  end: number
  startOpacity: number
  endOpacity: number
}

export type SliderTransitions = { left: SliderTransition; right: SliderTransition }

function percent(value: unknown, fallback: number) {
  if (value == null || value === "") return fallback
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : fallback
}

export function sliderTransitions(value: unknown, legacyEnd?: unknown): SliderTransitions {
  const source = value && typeof value === "object" ? value as Partial<SliderTransitions> : {}
  const normalize = (input: Partial<SliderTransition> | undefined, fallback: SliderTransition): SliderTransition => {
    const start = Math.min(99, percent(input?.start, fallback.start))
    return {
      start,
      end: Math.max(start + 1, percent(input?.end, fallback.end)),
      startOpacity: percent(input?.startOpacity, fallback.startOpacity),
      endOpacity: percent(input?.endOpacity, fallback.endOpacity),
    }
  }
  return {
    left: normalize(source.left, { start: 0, end: sliderRevealEnd(legacyEnd), startOpacity: 100, endOpacity: 0 }),
    right: normalize(source.right, { start: 88, end: 100, startOpacity: 0, endOpacity: 100 }),
  }
}

export function sliderTransitionMask(value: unknown, legacyEnd?: unknown) {
  if (!value) return `linear-gradient(90deg, transparent 0%, #000 ${sliderRevealEnd(legacyEnd)}%, #000 100%), linear-gradient(90deg, #000 calc(100% - min(12%, 192px)), transparent 100%)`
  const settings = sliderTransitions(value, legacyEnd)
  return [settings.left, settings.right].map(side =>
    `linear-gradient(90deg, rgba(0,0,0,${1 - side.startOpacity / 100}) ${side.start}%, rgba(0,0,0,${1 - side.endOpacity / 100}) ${side.end}%)`
  ).join(", ")
}
