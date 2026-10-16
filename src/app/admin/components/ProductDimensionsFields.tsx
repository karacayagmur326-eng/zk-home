"use client"

type Props = {
  weight: string
  length: string
  width: string
  height: string
  onWeightChange: (value: string) => void
  onLengthChange: (value: string) => void
  onWidthChange: (value: string) => void
  onHeightChange: (value: string) => void
}

export default function ProductDimensionsFields(props: Props) {
  const fields = [
    { label: "Ağırlık (kg)", value: props.weight, change: props.onWeightChange },
    { label: "Uzunluk (cm)", value: props.length, change: props.onLengthChange },
    { label: "Genişlik (cm)", value: props.width, change: props.onWidthChange },
    { label: "Yükseklik (cm)", value: props.height, change: props.onHeightChange },
  ]

  return <fieldset className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/30 p-4">
    <legend className="px-1 text-xs font-bold text-slate-700">Ağırlık ve boyutlar</legend>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {fields.map(field => <label key={field.label} className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
        <span className="block">{field.label}</span>
        <input type="number" min="0" step="any" inputMode="decimal" value={field.value} onChange={event => field.change(event.target.value)} placeholder="0" className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#C98484]" />
      </label>)}
    </div>
  </fieldset>
}
