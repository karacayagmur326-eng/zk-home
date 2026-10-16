"use client"

import { useId, useState } from "react"
import { Search, Plus, X } from "lucide-react"

type Tag = { id: string; value: string }
type Props = {
  tags: Tag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  input: string
  onInputChange: (value: string) => void
  onCreate: () => Promise<void>
}

const normalize = (value: string) => value.toLocaleLowerCase("tr-TR")
  .replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[-_\s]+/g, " ").trim()

const labelFor = (value: string) => value.includes("-")
  ? value.split("-").map(word => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1)).join(" ")
  : value

export default function ProductTagPicker({ tags, selectedIds, onChange, input, onInputChange, onCreate }: Props) {
  const inputId = useId()
  const resultsId = `${inputId}-results`
  const [creating, setCreating] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const search = normalize(input)
  const matches = tags.filter(tag => !selectedIds.includes(tag.id) && normalize(tag.value).includes(search))
  const exact = search ? tags.find(tag => normalize(tag.value) === search) : undefined
  const select = (tag: Tag) => {
    onChange(Array.from(new Set([...selectedIds, tag.id])))
    onInputChange("")
  }
  const add = async () => {
    if (!input.trim() || creating) return
    if (exact) { select(exact); return }
    setCreating(true)
    try { await onCreate() } finally { setCreating(false) }
  }

  return <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3">
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
      <h3 className="text-sm font-extrabold text-slate-900">Ürün Etiketleri</h3>
      <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">{selectedIds.length} seçili</span>
    </div>
    {selectedIds.length > 0 && <div>
      <p className="text-[11px] font-semibold text-slate-500 mb-2">Seçili Etiketler</p>
      <div className="flex flex-wrap gap-1.5">
        {selectedIds.map(id => <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-xs font-bold text-rose-700">
          {labelFor(tags.find(tag => tag.id === id)?.value || id)}
          <button type="button" aria-label={`${tags.find(tag => tag.id === id)?.value || id} etiketini kaldır`} onClick={() => onChange(selectedIds.filter(value => value !== id))} className="grid h-6 w-6 shrink-0 place-items-center rounded-md hover:bg-rose-100 hover:text-red-600 cursor-pointer"><X className="h-3 w-3" /></button>
        </span>)}
      </div>
    </div>}
    <div className="border-t border-slate-100 pt-3">
      <label htmlFor={inputId} className="block text-[11px] font-semibold text-slate-600 mb-2">Etiket ekle</label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input id={inputId} type="search" autoComplete="off" aria-controls={resultsId} value={input} onChange={event => onInputChange(event.target.value)} placeholder="Örn. kavanoz" onKeyDown={event => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault()
            if (exact) select(exact)
            else if (search && matches.length) select(matches[0])
          }
        }} className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-[#C98484] bg-slate-50/50 focus:bg-white" />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Arayın, sonuçlardan bir etikete tıklayarak ekleyin.</p>
    </div>
    <div id={resultsId}>
      {!search && <button type="button" aria-expanded={showAll} onClick={() => setShowAll(value => !value)} className="text-xs font-medium text-slate-500 hover:text-rose-700">{showAll ? "Listeyi kapat" : "Mevcut etiketlere göz at"}</button>}
      {(search || showAll) && <>
      <p aria-live="polite" className="text-[11px] font-semibold text-slate-500 mb-2">{search ? `${matches.length} sonuç` : "Mevcut etiketler"}</p>
      <div key={search} className="max-h-52 overflow-y-auto space-y-1 pr-1">
        {matches.map(tag => <button key={tag.id} type="button" onClick={() => select(tag)} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 cursor-pointer">
          <span>{labelFor(tag.value)}</span><Plus aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>)}
      </div>
      {search && !matches.length && <p className="py-2 text-xs text-slate-500">{exact ? "Bu etiket zaten seçili." : "Eşleşen etiket bulunamadı."}</p>}
      </>}
      {search && !exact && <button type="button" onClick={() => void add()} disabled={creating} className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-rose-200 bg-rose-50/40 px-3 py-3 text-left text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Plus aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{creating ? "Oluşturuluyor…" : `“${input.trim()}” etiketini oluştur`}</span></button>}
    </div>
  </div>
}
