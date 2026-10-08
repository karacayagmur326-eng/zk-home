"use client"

import { useEffect, useRef, type ComponentType, type KeyboardEvent, type ReactNode } from "react"

export type AdminTab<T extends string> = {
  value: T
  label: string
  count?: ReactNode
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  disabled?: boolean
}

/** All admin section menus share their appearance, focus and selection behavior. */
export default function AdminTabs<T extends string>({
  items, value, onChange, label = "Bölüm menüsü",
}: {
  items: readonly AdminTab<T>[]
  value: T | null
  onChange: (value: T) => void
  label?: string
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const list = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const container = list.current
    if (!container) return
    const revealSelection = () => {
      const button = buttons.current[items.findIndex((item) => item.value === value)]
      if (!button) return
      const bounds = container.getBoundingClientRect()
      const selectedBounds = button.getBoundingClientRect()
      if (selectedBounds.right > bounds.right - 8) container.scrollLeft += selectedBounds.right - bounds.right + 8
      else if (selectedBounds.left < bounds.left + 8) container.scrollLeft += selectedBounds.left - bounds.left - 8
    }
    revealSelection()
    const observer = new ResizeObserver(revealSelection)
    observer.observe(container)
    return () => observer.disconnect()
  }, [value, items])
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const enabled = items.flatMap((item, i) => item.disabled ? [] : [i])
    const current = enabled.indexOf(index)
    const next = event.key === "Home" ? enabled[0]
      : event.key === "End" ? enabled[enabled.length - 1]
      : enabled[(current + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length]
    if (next === undefined) return
    buttons.current[next]?.focus()
    onChange(items[next].value)
  }
  const selected = items.findIndex((item) => item.value === value && !item.disabled)
  const focusIndex = selected >= 0 ? selected : items.findIndex((item) => !item.disabled)
  return (
    <div ref={list} role="tablist" aria-label={label} className="flex w-full min-w-0 items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs">
      {items.map((item, index) => {
        const active = item.value === value
        const Icon = item.icon
        return (
          <button key={item.value} ref={(button) => { buttons.current[index] = button }}
            type="button" role="tab" aria-selected={active} disabled={item.disabled}
            tabIndex={index === focusIndex ? 0 : -1}
            onClick={() => onChange(item.value)} onKeyDown={(event) => navigate(event, index)}
            className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B98787] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${active ? "bg-[#B98787] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />}
            {item.label}
            {item.count !== undefined && item.count !== null && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
