"use client"
import { useMemo, useRef, useState } from "react"
import type { WorkBook } from "@e965/xlsx"
import { IMPORT_FIELDS, CatalogRow, ColumnMapping, defaultColumnMapping, importColumns, matchSkuImages, normalizedSku, parseCatalogRows } from "@lib/commerce/import-catalog"
import { uploadMediaFiles, UploadedMedia } from "@lib/admin/upload-media"

const fileKey = (f:File) => `${f.webkitRelativePath || f.name}|${f.size}|${f.lastModified}`
const emptyMapping = Object.fromEntries(IMPORT_FIELDS.map(([field])=>[field,null])) as ColumnMapping
export default function ExcelImportPage() {
  const [book,setBook]=useState<WorkBook|null>(null), [fileName,setFileName]=useState("")
  const [sheetName,setSheetName]=useState(""), [mapping,setMapping]=useState<ColumnMapping>(emptyMapping)
  const [files,setFiles]=useState<File[]>([]), [covers,setCovers]=useState<Record<number,string>>({})
  const [selected,setSelected]=useState<Set<number>>(new Set()), [existing,setExisting]=useState<string[]>([])
  const [categoryIssues,setCategoryIssues]=useState<Record<number,string[]>>({})
  const [previewed,setPreviewed]=useState(false), [busy,setBusy]=useState(false)
  const [status,setStatus]=useState("draft"), [progress,setProgress]=useState(""), [error,setError]=useState("")
  const [results,setResults]=useState<Record<number,string>>({})
  const uploaded=useRef(new Map<string,UploadedMedia>())
  const sheet=book?.Sheets[sheetName]
  const columns=useMemo(()=>sheet?importColumns(sheet):[],[sheet])
  const rows=useMemo(()=>sheet?parseCatalogRows(sheet,mapping):[],[sheet,mapping])
  const matches=useMemo(()=>new Map(rows.map(row=>[row.sourceRow,matchSkuImages(files,row.sku)])),[rows,files])
  const existingSet=new Set(existing)
  const issuesFor=(row:CatalogRow,extra=categoryIssues) => [
    ...row.issues, ...(extra[row.sourceRow]||[]),
    ...(!matches.get(row.sourceRow)?.length?["Stok koduyla eşleşen görsel yok."]:[]),
    ...(matches.get(row.sourceRow)?.some(f=>f.size>8*1024*1024)?["Bir görsel 8 MB sınırını aşıyor."]:[]),
    ...(status==="published" && (row.salePrice??row.regularPrice)<=0?["Yayınlamak için fiyat gerekli."]:[]),
  ]
  const reset=()=>{setPreviewed(false);setSelected(new Set());setResults({});setCategoryIssues({});setError("");setProgress("")}
  async function chooseExcel(file?:File){
    if(!file)return
    reset();setBook(null);setFileName("")
    if(!/\.xlsx$/i.test(file.name)||file.size>10*1024*1024){setError("10 MB veya daha küçük bir .xlsx dosyası seçin.");return}
    setBusy(true)
    try{
      const xlsx=await import("@e965/xlsx")
      const next=xlsx.read(await file.arrayBuffer(),{type:"array",sheetRows:5002,cellFormula:false})
      const name=next.SheetNames[0]
      if(!name)throw new Error("Excel dosyasında çalışma sayfası yok.")
      setBook(next);setSheetName(name);setMapping(defaultColumnMapping(next.Sheets[name]));setFileName(file.name)
    }catch(e){setError(e instanceof Error?e.message:"Excel okunamadı.")}finally{setBusy(false)}
  }
  async function preview(){
    reset();setBusy(true)
    try{
      if(mapping.sku===null||mapping.title===null)throw new Error("Stok kodu ve ürün adı sütunlarını eşleştirin.")
      if(!rows.length)throw new Error("Aktarılacak ürün satırı yok.")
      const res=await fetch("/api/admin/products/import/catalog",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"preview",rows:rows.filter(row=>!row.issues.length)})})
      const data=await res.json();if(!res.ok)throw new Error(data.error||"Ön kontrol başarısız.")
      const found:string[]=data.existingSkus||[],extra:Record<number,string[]>=data.categoryIssuesByRow||{}
      setExisting(found);setCategoryIssues(extra);setPreviewed(true)
      setSelected(new Set(rows.filter(row=>!issuesFor(row,extra).length&&!found.includes(normalizedSku(row.sku))).map(row=>row.sourceRow)))
    }catch(e){setError(e instanceof Error?e.message:"Ön kontrol başarısız.")}finally{setBusy(false)}
  }
  async function startImport(){
    const queue=rows.filter(row=>selected.has(row.sourceRow)&&!issuesFor(row).length&&!existingSet.has(normalizedSku(row.sku)))
    setBusy(true);setError("")
    let added=0,failed=0,skipped=0
    for(let i=0;i<queue.length;i++){
      const row=queue[i]
      if(results[row.sourceRow]?.startsWith("Eklendi")){skipped++;continue}
      try{
        const candidates=[...(matches.get(row.sourceRow)||[])]
        const cover=covers[row.sourceRow]||fileKey(candidates[0])
        candidates.sort((a,b)=>Number(fileKey(b)===cover)-Number(fileKey(a)===cover))
        const imageIds:string[]=[]
        for(let n=0;n<candidates.length;n++){
          const file=candidates[n],key=fileKey(file)
          setProgress(`${i+1}/${queue.length} · ${row.sku} · Görsel ${n+1}/${candidates.length} yükleniyor`)
          let media=uploaded.current.get(key)
          if(!media){
            const outcome=await uploadMediaFiles([file]);media=outcome.uploaded[0]
            if(!media||outcome.errors.length)throw new Error(outcome.errors.join(" · ")||"Görsel yüklenemedi.")
            uploaded.current.set(key,media)
          }
          imageIds.push(media.id)
        }
        const res=await fetch("/api/admin/products/import/catalog",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({row,status,imageIds})})
        const data=await res.json();if(!res.ok||!data.success)throw new Error(data.error||"Ürün kaydedilemedi.")
        if(data.skipped)skipped++;else added++
        setResults(previous=>({...previous,[row.sourceRow]:data.skipped?"Zaten mevcut; atlandı.":`Eklendi (${status==="draft"?"taslak":"yayında"})`}))
      }catch(e){failed++;setResults(previous=>({...previous,[row.sourceRow]:`Hata: ${e instanceof Error?e.message:"Aktarılamadı."}`}))}
    }
    setProgress(`İçe aktarma tamamlandı: ${added} ürün eklendi, ${skipped} mevcut ürün atlandı, ${failed} hata.`);setBusy(false)
  }
  const eligible=rows.filter(row=>selected.has(row.sourceRow)&&!issuesFor(row).length&&!existingSet.has(normalizedSku(row.sku))&&!results[row.sourceRow]?.startsWith("Eklendi"))
  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <div><h1 className="text-2xl font-semibold">Excel Katalog İçe Aktarım</h1><p className="mt-2 text-sm text-slate-500">Excel sütunlarını eşleştirin, stok kodu klasörlerindeki görselleri seçin ve aktarılacak ürünleri kontrol edin.</p></div>
    {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
    <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
      <section className="admin-card p-6"><h2 className="mb-4 text-lg font-semibold">1. Excel dosyası</h2>
        <input aria-label="Excel dosyası" type="file" accept=".xlsx" onChange={e=>void chooseExcel(e.target.files?.[0])}/>
        {book&&<div className="mt-4 flex flex-wrap items-center gap-4"><span className="text-sm">{fileName}</span><label>Çalışma sayfası <select aria-label="Çalışma sayfası" className="rounded border p-2" value={sheetName} onChange={e=>{reset();setSheetName(e.target.value);setMapping(defaultColumnMapping(book.Sheets[e.target.value]))}}>{book.SheetNames.map(name=><option key={name}>{name}</option>)}</select></label><span className="text-sm text-slate-500">{rows.length} ürün satırı · En fazla 5.000 satır</span></div>}
      </section>
      {book&&<section className="admin-card p-6"><h2 className="mb-2 text-lg font-semibold">2. Sütun eşleştirme</h2><p className="mb-5 text-sm text-slate-500">Her site alanının Excel sütununu seçin. Sütun harfleri aynı başlıklı alanları ayırt eder. Kullanılmayacak alanı boş bırakın.</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{IMPORT_FIELDS.map(([field,label])=><label key={field} className="text-sm font-medium">{label}<select aria-label={label} value={mapping[field]??""} onChange={e=>{reset();setMapping({...mapping,[field]:e.target.value===""?null:Number(e.target.value)})}} className="mt-2 block w-full rounded-lg border border-slate-200 bg-white p-3"><option value="">Aktarılmayacak</option>{columns.map(column=><option key={column.index} value={column.index}>{column.label}</option>)}</select></label>)}</div>
        <p className="mt-5 text-sm text-slate-500">Stok kodları metin olarak korunur. * ile ayrılan kategorilerin tümü atanır. İndirimli fiyat boşsa normal fiyat kullanılır. “Adet” stok sayısı değilse Stok adedi alanını aktarılmayacak olarak seçin. Yeni markalar otomatik eklenir.</p>
      </section>}
      <section className="admin-card p-6"><h2 className="mb-2 text-lg font-semibold">3. Ürün görselleri</h2><p className="mb-4 text-sm text-slate-500">ZK klasörünü seçin. Her stok kodunun klasöründeki ilk görsel kapak, diğerleri galeri olur. Kapağı ön izlemede değiştirebilirsiniz. JPEG, PNG, WebP ve AVIF; görsel başına en fazla 8 MB.</p>
        <input aria-label="Görsel klasörü" type="file" multiple {...({webkitdirectory:"",directory:""} as Record<string,string>)} onChange={e=>{reset();setFiles(Array.from(e.target.files||[]));setCovers({});uploaded.current.clear()}}/>
        {files.length>0&&<p className="mt-3 text-sm">{files.length} dosya seçildi. Görseller tek tek yüklenir ve kayıpsız optimize edilir.</p>}
      </section>
      <div className="flex flex-wrap items-center gap-4"><label>Aktarım durumu <select aria-label="Aktarım durumu" className="ml-2 rounded-lg border p-3" value={status} onChange={e=>{reset();setStatus(e.target.value)}}><option value="draft">Taslak</option><option value="published">Yayında</option></select></label><button className="admin-btn admin-btn-primary" disabled={!book||!files.length} onClick={()=>void preview()}>Ürünleri Ön İzle</button></div>
      {previewed&&<section className="admin-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 p-5"><div><h2 className="text-lg font-semibold">4. Aktarım ön izlemesi</h2><p className="text-sm text-slate-500">{eligible.length} ürün seçili. Eksik alanlı ve mevcut stok kodlu ürünler atlanır.</p></div><div className="flex flex-wrap gap-2"><button className="admin-btn admin-btn-secondary" onClick={()=>setSelected(new Set(rows.filter(row=>!issuesFor(row).length&&!existingSet.has(normalizedSku(row.sku))&&!results[row.sourceRow]?.startsWith("Eklendi")).map(row=>row.sourceRow)))}>Uygunları Seç</button><button className="admin-btn admin-btn-secondary" onClick={()=>setSelected(new Set())}>Seçimi Temizle</button><button className="admin-btn admin-btn-primary" disabled={!eligible.length} onClick={()=>void startImport()}>Seçilen {eligible.length} Ürünü İçeri Aktar</button></div></div>
        <div className="max-h-[650px] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-100"><tr>{["Seç","Satır / Stok kodu","Ürün / Kategoriler","Fiyat / Stok","Kapak / Galeri","Durum"].map(t=><th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{rows.map(row=>{
          const images=matches.get(row.sourceRow)||[],issues=issuesFor(row),found=existingSet.has(normalizedSku(row.sku)),done=results[row.sourceRow]?.startsWith("Eklendi")
          return <tr key={row.sourceRow} className="border-t border-slate-100 align-top"><td className="p-3"><input type="checkbox" aria-label={`${row.sku||`Satır ${row.sourceRow}`} seç`} checked={selected.has(row.sourceRow)} disabled={!!issues.length||found||done} onChange={e=>setSelected(previous=>{const next=new Set(previous);if(e.target.checked)next.add(row.sourceRow);else next.delete(row.sourceRow);return next})}/></td><td className="p-3"><span className="text-slate-400">{row.sourceRow}</span><div className="font-medium">{row.sku||"Eksik"}</div></td><td className="min-w-48 p-3"><div className="font-medium">{row.title}</div><div className="mt-1 text-slate-500">{row.categories.join(" · ")}</div><details className="mt-2"><summary className="cursor-pointer text-[#C98484]">Yazıları kontrol et</summary><p className="mt-2 whitespace-pre-wrap"><b>Ürün Özeti</b><br/>{row.summary}</p><p className="mt-2 whitespace-pre-wrap"><b>Ürün Açıklaması</b><br/>{row.description}</p></details></td><td className="whitespace-nowrap p-3">{(row.salePrice??row.regularPrice).toLocaleString("tr-TR")} TL<div className="text-slate-500">Stok: {row.stock??"Takip edilmiyor"}</div></td><td className="min-w-52 p-3">{images.length>0&&<select aria-label={`${row.sku} kapak görseli`} className="max-w-64 rounded border p-2" value={covers[row.sourceRow]||fileKey(images[0])} onChange={e=>setCovers({...covers,[row.sourceRow]:e.target.value})}>{images.map(file=><option key={fileKey(file)} value={fileKey(file)}>{file.name}</option>)}</select>}<div className="mt-2 text-slate-500">{images.length?`1 kapak + ${images.length-1} galeri görseli`:"Görsel yok"}</div></td><td className={`min-w-40 p-3 ${results[row.sourceRow]?.startsWith("Hata")||issues.length?"text-red-600":"text-emerald-700"}`}>{results[row.sourceRow]||(found?"Zaten mevcut; atlanacak.":issues.join(" · ")||"Aktarıma hazır")}</td></tr>
        })}</tbody></table></div>
      </section>}
    </fieldset>
    {(busy||progress)&&<div role="status" className="admin-card p-4 text-sm">{progress||"Dosya kontrol ediliyor…"}{busy&&<p className="mt-2 text-slate-500">Aktarım bitene kadar bu sekmeyi açık tutun.</p>}</div>}
  </div>
}
