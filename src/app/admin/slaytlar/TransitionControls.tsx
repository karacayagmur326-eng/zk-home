"use client"

import { sliderTransitions, type SliderTransitions } from "@lib/content/slider-reveal"

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
              <div className="flex items-center gap-2">
                <input id={`transition-${side}-${key}`} type="range" min={key === "end" ? 1 : 0} max={key === "start" ? 99 : 100} step="1"
                  value={value[side][key]} onChange={event => update(event.target.value)}
                  className="min-w-0 flex-1 accent-[#C98484]" />
                <input type="number" aria-label={name} min={key === "end" ? 1 : 0} max={key === "start" ? 99 : 100} step="1"
                  value={value[side][key]} onChange={event => update(event.target.value)}
                  className="h-8 w-16 rounded border border-gray-200 bg-white px-2 text-xs" />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
          })}
        </fieldset>
      ))}
    </div>
  </>
}
