"use client"

import { useId, useState } from "react"

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
      <span className="text-[11px] font-bold text-slate-400">{selectedIds.length}/{tags.length} seçili</span>
    </div>
    {selectedIds.length > 0 && <div>
      <p className="text-[11px] font-semibold text-slate-500 mb-2">Seçili Etiketler</p>
      <div className="flex flex-wrap gap-1.5">
        {selectedIds.map(id => <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-xs font-bold text-rose-700">
          {labelFor(tags.find(tag => tag.id === id)?.value || id)}
          <button type="button" aria-label={`${tags.find(tag => tag.id === id)?.value || id} etiketini kaldır`} onClick={() => onChange(selectedIds.filter(value => value !== id))} className="hover:text-red-600 cursor-pointer">×</button>
        </span>)}
      </div>
    </div>}
    <div className="border-t border-slate-100 pt-3">
      <label htmlFor={inputId} className="block text-[11px] font-semibold text-slate-500 mb-2">Etiket ara veya oluştur</label>
      <div className="flex gap-2">
        <input id={inputId} type="search" autoComplete="off" aria-controls={resultsId} value={input} onChange={event => onInputChange(event.target.value)} placeholder="Örn. kavanoz" onKeyDown={event => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault()
            if (exact) select(exact)
            else if (search && matches.length) select(matches[0])
            else void add()
          }
        }} className="min-w-0 flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#C98484] bg-slate-50/50 focus:bg-white" />
        <button type="button" onClick={() => void add()} disabled={!input.trim() || creating || Boolean(exact && selectedIds.includes(exact.id))} className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 shrink-0 disabled:opacity-50">
          {creating ? "Ekleniyor…" : exact ? selectedIds.includes(exact.id) ? "Seçili" : "Seç" : "+ Yeni etiket"}
        </button>
      </div>
    </div>
    <div id={resultsId}>
      <p aria-live="polite" className="text-[11px] font-semibold text-slate-500 mb-2">{search ? `${matches.length} eşleşen etiket` : "Mevcut Etiketler"}</p>
      <div key={search} className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
        {matches.map(tag => <button key={tag.id} type="button" onClick={() => select(tag)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 text-xs font-medium text-slate-700 hover:text-rose-700 cursor-pointer">
          <span aria-hidden="true">+</span>{labelFor(tag.value)}
        </button>)}
      </div>
      {search && !matches.length && <p className="text-xs text-slate-500">{exact ? "Bu etiket zaten seçili." : "Mevcut etiket bulunamadı. İsterseniz yeni etiket ekleyebilirsiniz."}</p>}
    </div>
  </div>
}
