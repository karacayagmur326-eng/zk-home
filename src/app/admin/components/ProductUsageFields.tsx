type Props = {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
}

export default function ProductUsageFields({ title, content, onTitleChange, onContentChange }: Props) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-rose-100 bg-rose-50/30 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">Kullanım ve Sunum Önerileri</legend>
      <p className="text-xs leading-relaxed text-slate-500">Açıklamanın altında gösterilir. Yalnızca bu ürünün doğrulanmış bilgilerini kullanın; dekorasyon fikirlerini öneri olarak yazın.</p>
      <label className="block text-xs font-semibold text-slate-700">
        Öneri bölümü başlığı
        <input value={title} onChange={event => onTitleChange(event.target.value)} maxLength={120} placeholder="Örneğin: Pasta ve Tatlı Sunumlarınıza Zarif Bir Dokunuş" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal" />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Kullanım ve sunum metni
        <textarea value={content} onChange={event => onContentChange(event.target.value)} maxLength={4000} rows={6} placeholder="Paragrafları boş bir satırla ayırabilirsiniz." className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal leading-relaxed" />
      </label>
    </fieldset>
  )
}
