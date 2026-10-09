export function sliderRevealEnd(value: unknown): number {
  const percent = value == null ? 65 : Number(value)
  return Number.isFinite(percent) ? Math.max(5, Math.min(100, percent)) : 65
}

export type SliderTransition = {
  start: number
  end: number
  startOpacity: number
  endOpacity: number
  blur: number
}

export type SliderTransitions = { version: 2; left: SliderTransition; right: SliderTransition }

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
      blur: Math.min(30, percent(input?.blur, 0)),
    }
  }
  let right = normalize(source.right, source.right && source.version !== 2
    ? { start: 88, end: 100, startOpacity: 0, endOpacity: 100, blur: 0 }
    : { start: 0, end: 12, startOpacity: 100, endOpacity: 0, blur: 0 })
  // Preserve the appearance of previously saved positions measured from the left.
  if (source.right && source.version !== 2) right = {
    ...right,
    start: 100 - right.end,
    end: 100 - right.start,
    startOpacity: right.endOpacity,
    endOpacity: right.startOpacity,
  }
  return {
    version: 2,
    left: normalize(source.left, { start: 0, end: sliderRevealEnd(legacyEnd), startOpacity: 100, endOpacity: 0, blur: 0 }),
    right,
  }
}

export function sliderTransitionMask(value: unknown, legacyEnd?: unknown) {
  if (!value) return `linear-gradient(90deg, transparent 0%, #000 ${sliderRevealEnd(legacyEnd)}%, #000 100%), linear-gradient(90deg, #000 calc(100% - min(12%, 192px)), transparent 100%)`
  const settings = sliderTransitions(value, legacyEnd)
  return [settings.left, settings.right].map((side, index) =>
    `linear-gradient(${index === 0 ? 90 : 270}deg, rgba(0,0,0,${1 - side.startOpacity / 100}) ${side.start}%, rgba(0,0,0,${1 - side.endOpacity / 100}) ${side.end}%)`
  ).join(", ")
}

export function sliderBlurMask(value: SliderTransitions, side: "left" | "right") {
  const transition = value[side]
  return `${sliderTransitionMask(value)}, linear-gradient(${side === "left" ? 90 : 270}deg, #000 ${transition.start}%, transparent ${transition.end}%)`
}
