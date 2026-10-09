"use client"

import { sliderTransitions, type SliderTransitions } from "@lib/content/slider-reveal"
import { useEffect, useState } from "react"

function PercentInput({ value, min, max, label, onCommit }: {
  value: number; min: number; max: number; label: string; onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  return <input type="number" aria-label={label} min={min} max={max} step="1"
    value={draft} onChange={event => setDraft(event.target.value)}
    onBlur={() => {
      if (draft.trim() === "") setDraft(String(value))
      else {
        const next = Math.max(min, Math.min(max, Number(draft)))
        setDraft(String(next))
        onCommit(String(next))
      }
    }}
    onKeyDown={event => {
      if (event.key === "Enter") {
        event.preventDefault()
        event.currentTarget.blur()
      }
    }}
    className="h-8 w-20 shrink-0 rounded border border-gray-200 bg-white px-2 text-xs" />
}

export default function TransitionControls({ value, disabled, onChange }: {
  value: SliderTransitions
  disabled: boolean
  onChange: (value: SliderTransitions) => void
}) {
  return <>
    <p className="text-[11px] text-gray-500">Konumlar resmin solundan sağına %0–100 arasındadır. Renk opaklığı %0 iken resim görünür, %100 iken seçtiğiniz zemin rengi görünür.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {(["left", "right"] as const).map(side => (
        <fieldset key={side} disabled={disabled} className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 disabled:opacity-50">
          <legend className="px-1 text-xs font-bold text-gray-700">{side === "left" ? "Sol Geçiş" : "Sağ Geçiş"}</legend>
          {([
            ["start", "Başlangıç konumu"],
            ["startOpacity", "Başlangıç renk opaklığı"],
            ["end", "Bitiş konumu"],
            ["endOpacity", "Bitiş renk opaklığı"],
          ] as const).map(([key, label]) => {
            const name = `${side === "left" ? "Sol" : "Sağ"} geçiş ${label.toLocaleLowerCase("tr-TR")}`
            const update = (next: string) => onChange(sliderTransitions({
              ...value,
              [side]: { ...value[side], [key]: Number(next) },
            }))
            return <div key={key} className="space-y-1">
              <label htmlFor={`transition-${side}-${key}`} className="text-[11px] font-semibold text-gray-600">{label}</label>
              <input id={`transition-${side}-${key}`} type="range" min={key === "end" ? 1 : 0} max={key === "start" ? 99 : 100} step="1"
                value={value[side][key]} onChange={event => update(event.target.value)}
                className="block h-6 w-full min-w-0 cursor-pointer accent-[#C98484] disabled:cursor-not-allowed" />
              <div className="flex items-center gap-2">
                <PercentInput label={name} min={key === "end" ? value[side].start + 1 : 0} max={key === "start" ? 99 : 100}
                  value={value[side][key]} onCommit={update} />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
          })}
        </fieldset>
      ))}
    </div>
  </>
}
