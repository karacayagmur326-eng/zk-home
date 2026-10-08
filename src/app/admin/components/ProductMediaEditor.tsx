"use client"

import { ImagePlus, Images, Star, Trash2, Plus, Pencil } from "lucide-react"

export default function ProductMediaEditor({ thumbnail, images, onCoverChange, onImagesChange, onUploadCover, onUploadGallery }: {
  thumbnail: string; images: string[]; onCoverChange: (url: string) => void
  onImagesChange: (urls: string[]) => void; onUploadCover: () => void; onUploadGallery: () => void
}) {
  return <>
    <section className="overflow-hidden rounded-2xl border border-[#EADBD4]/70 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#F3ECE8] px-4 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF3EF] text-[#B77B75]"><ImagePlus className="h-4 w-4" /></span><div><h3 className="text-sm font-semibold text-slate-800">Kapak Görseli</h3><p className="mt-0.5 text-[11px] text-slate-400">Ürünün vitrindeki ilk görünümü</p></div><span className="ml-auto rounded-full bg-[#FAF3EF] px-2 py-1 text-[10px] font-medium text-[#B77B75]">4:5</span></div>
      <div className="p-4">
        <button type="button" onClick={onUploadCover} className="group relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-xl border border-[#EADBD4]/70 bg-[#FBF7F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]" aria-label={thumbnail ? "Kapak görselini değiştir" : "Kapak görseli yükle"}>
          {thumbnail ? <><img src={thumbnail} alt="Ürün kapak görseli" className="h-full w-full object-contain" /><span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-[11px] font-medium text-slate-700 shadow-sm"><Pencil className="h-3 w-3" />Değiştir</span></> : <span className="flex flex-col items-center gap-2 text-[#B77B75]"><ImagePlus className="h-7 w-7" /><span className="text-xs font-medium">Kapak görseli ekle</span></span>}
        </button>
        {thumbnail && <button type="button" onClick={() => onCoverChange("")} className="mx-auto mt-3 flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" />Görseli kaldır</button>}
      </div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-[#EADBD4]/70 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#F3ECE8] px-4 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF3EF] text-[#B77B75]"><Images className="h-4 w-4" /></span><div><h3 className="text-sm font-semibold text-slate-800">Ürün Galerisi</h3><p className="mt-0.5 text-[11px] text-slate-400">Bir görseli kapak olarak seçebilirsiniz</p></div><span className="ml-auto text-xs text-slate-400">{images.length}</span></div>
      <div className="p-4"><div className="grid grid-cols-2 gap-3">
        {images.map((url, index) => <div key={url} className={`relative overflow-hidden rounded-xl border bg-[#FBF7F4] ${thumbnail === url ? "border-[#C98484] ring-1 ring-[#C98484]/20" : "border-[#EADBD4]/60"}`}>
          <div className="aspect-[4/5]"><img src={url} alt={`Ürün galeri görseli ${index + 1}`} className="h-full w-full object-contain" /></div>
          <button type="button" aria-label={`${index + 1}. galeri görselini kaldır`} onClick={() => onImagesChange(images.filter(item => item !== url))} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-400 shadow-sm hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>
          <button type="button" aria-pressed={thumbnail === url} onClick={() => onCoverChange(url)} className={`flex min-h-10 w-full items-center justify-center gap-1 border-t px-1 text-[10px] font-medium ${thumbnail === url ? "border-[#EADBD4] bg-[#F8ECE6] text-[#A95E5E]" : "border-[#F3ECE8] bg-white text-slate-500 hover:text-[#A95E5E]"}`}><Star className={`h-3 w-3 ${thumbnail === url ? "fill-current" : ""}`} />{thumbnail === url ? "Kapak görseli" : "Kapak yap"}</button>
        </div>)}
        <button type="button" onClick={onUploadGallery} className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#DCC5BC] bg-[#FDFAF8] px-2 text-center text-[#B77B75] transition-colors hover:bg-[#F8ECE6]"><Plus className="h-5 w-5" /><span className="text-[11px] font-medium">Görsel ekle</span></button>
      </div></div>
    </section>
  </>
}
