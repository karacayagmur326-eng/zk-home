"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import SeoFields from "../components/SeoFields"
import GoogleSeoSettings from "../components/GoogleSeoSettings"
import { plainText } from "@lib/seo/entity"
import { isPrivatePath } from "@lib/seo/indexing"

export default function SeoPage() {
  const [data, setData] = useState<any>(null),
    [selected, setSelected] = useState<any>(null),
    [filter, setFilter] = useState(""),
    [kind, setKind] = useState("all"),
    [issuesOnly, setIssuesOnly] = useState(false),
    [message, setMessage] = useState(""),
    [pendingImport, setPendingImport] = useState<any[]>([]),
    [saving, setSaving] = useState(false)
  const refresh = () =>
    fetch("/api/admin/seo")
      .then((response) => response.json())
      .then((result) =>
        result.error ? setMessage(result.error) : setData(result)
      )
      .catch(() => setMessage("Rapor yüklenemedi."))
  useEffect(() => {
    refresh()
  }, [])
  async function save(changes: any[]) {
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setMessage(`${result.saved.length} kaydın SEO ayarları kaydedildi.`)
      setPendingImport([])
      setSelected(null)
      await refresh()
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }
  const [crawlRows, setCrawlRows] = useState<any[]>([]),
    [crawling, setCrawling] = useState(false)
  async function crawl() {
    setCrawling(true)
    setCrawlRows([])
    setMessage("")
    const queue: string[] = Array.from(
        new Set<string>([
          "/",
          ...data.rows
            .filter(
              (row: any) =>
                row.status === "published" && !isPrivatePath(row.path)
            )
            .map((row: any) => row.path),
        ])
      ),
      seen = new Set(queue),
      result: any[] = []
    try {
      for (let offset = 0; offset < queue.length; offset += 10) {
        const response = await fetch("/api/admin/seo/crawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: queue.slice(offset, offset + 10) }),
        })
        const batch = await response.json()
        if (!response.ok) throw new Error(batch.error || "Tarama tamamlanamadı")
        for (const row of batch.rows) {
          result.push(row)
          for (const path of row.links || [])
            if (!seen.has(path) && seen.size < 2000) {
              seen.add(path)
              queue.push(path)
            }
        }
        setCrawlRows([...result])
        setMessage(`${result.length} / ${queue.length} sayfa kontrol edildi.`)
      }
      setMessage(
        `Tarama tamamlandı: ${result.length} sayfa, ${
          result.filter((row) => row.issues.length).length
        } uyarılı sayfa.`
      )
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setCrawling(false)
    }
  }
  async function exportCrawl() {
    const XLSX = await import("@e965/xlsx"),
      workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        crawlRows.map((row) => ({
          path: row.path,
          status: row.status,
          final_url: row.finalUrl,
          redirects: row.redirects,
          title: row.title,
          h1: row.h1?.join(" | "),
          description: row.description,
          robots: row.robots,
          canonical: row.canonical,
          json_ld: row.schemaCount,
          issues: row.issues.join("; "),
        }))
      ),
      "Tarama"
    )
    XLSX.writeFile(workbook, "ZK-Home-SEO-Tarama.xlsx")
  }
  async function exportFile(format: "xlsx" | "csv" = "xlsx") {
    const XLSX = await import("@e965/xlsx")
    const rows = data.rows.map((row: any) => ({
      kind: row.kind,
      id: row.id,
      name: row.title,
      seo_title: row.metadata.seo_title || "",
      seo_description: row.metadata.seo_description || "",
      h1_title: row.metadata.h1_title || "",
      seo_canonical: row.metadata.seo_canonical || "",
      seo_noindex: row.metadata.seo_noindex === true,
      seo_sitemap: row.metadata.seo_sitemap !== false,
      og_title: row.metadata.og_title || "",
      og_image: row.metadata.og_image || "",
      image_alt_texts: JSON.stringify(row.metadata.image_alt_texts || {}),
      issues: row.issues.join("; "),
    }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "SEO"
    )
    XLSX.writeFile(workbook, `ZK-Home-SEO.${format}`)
  }
  async function importFile(file?: File) {
    if (!file) return
    try {
      const XLSX = await import("@e965/xlsx"),
        workbook = XLSX.read(await file.arrayBuffer(), { type: "array" }),
        entries = XLSX.utils.sheet_to_json<any>(
          workbook.Sheets[workbook.SheetNames[0]],
          { defval: "" }
        )
      const changes = entries.map((entry) => {
        const row = data.rows.find(
          (row: any) => row.kind === entry.kind && row.id === entry.id
        )
        if (!row) throw new Error(`Kayıt bulunamadı: ${entry.id}`)
        const metadata: any = {}
        for (const key of [
          "seo_title",
          "seo_description",
          "h1_title",
          "seo_canonical",
          "og_title",
          "og_image",
        ])
          if (key in entry) metadata[key] = String(entry[key])
        for (const key of ["seo_noindex", "seo_sitemap"])
          if (key in entry)
            metadata[key] =
              entry[key] === true || /^(true|1)$/i.test(String(entry[key]))
        if (entry.image_alt_texts)
          metadata.image_alt_texts = JSON.parse(entry.image_alt_texts)
        return { kind: row.kind, id: row.id, metadata }
      })
      if (changes.length > 500)
        throw new Error("Dosyada en fazla 500 kayıt olmalıdır.")
      setPendingImport(changes)
      setMessage(
        `${changes.length} kayıt hazır. Önizlemeyi kontrol edip kaydedin.`
      )
    } catch (error: any) {
      setMessage(error.message)
    }
  }
  const rows = (data?.rows || []).filter(
    (row: any) =>
      (kind === "all" || row.kind === kind) &&
      (!issuesOnly || row.issues.length) &&
      `${row.title} ${row.handle}`
        .toLocaleLowerCase("tr-TR")
        .includes(filter.toLocaleLowerCase("tr-TR"))
  )
  return (
    <div className="space-y-5 p-5">
      <GoogleSeoSettings onSaved={refresh} />
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Canlı HTML ve bağlantı kontrolü</h2>
        <p className="mt-2 text-sm text-slate-600">
          Yayınlı sayfaları ve iç bağlantılarını tarar; HTTP hataları,
          yönlendirmeler, tek H1, title, meta açıklaması, canonical ve JSON-LD
          kontrol edilir.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            className="admin-btn admin-btn-secondary"
            disabled={!data || crawling}
            onClick={crawl}
          >
            {crawling ? "Taranıyor…" : "Canlı sayfaları tara"}
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            disabled={!crawlRows.length}
            onClick={exportCrawl}
          >
            Tarama raporunu indir
          </button>
        </div>
        {crawlRows.length > 0 && (
          <div className="mt-4 max-h-72 overflow-auto text-sm">
            {crawlRows
              .filter((row) => row.issues.length)
              .map((row) => (
                <p key={row.path} className="py-1 text-amber-800">
                  {row.path}: {row.issues.join(" · ")}
                </p>
              ))}
            <p>{crawlRows.length} sayfa kontrol edildi.</p>
          </div>
        )}
      </section>
      <h2 className="text-2xl font-bold">SEO yönetimi ve kontrol raporu</h2>
      {message && (
        <p
          role="status"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4"
        >
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button className="admin-btn admin-btn-secondary" onClick={refresh}>
          Raporu yenile
        </button>
        <button
          className="admin-btn admin-btn-secondary"
          disabled={!data}
          onClick={() => exportFile()}
        >
          Excel dışa aktar
        </button>
        <button
          className="admin-btn admin-btn-secondary"
          disabled={!data}
          onClick={() => exportFile("csv")}
        >
          CSV dışa aktar
        </button>
        <label className="admin-btn admin-btn-secondary">
          Excel / CSV içe aktar
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={!data}
            onChange={(event) => importFile(event.target.files?.[0])}
          />
        </label>
        <Link
          className="admin-btn admin-btn-secondary"
          href="/admin/tema-ayarlari"
        >
          Şablonlar ve Google ayarları
        </Link>
      </div>
      {pendingImport.length > 0 && (
        <section className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Toplu düzenleme önizlemesi</h2>
          <pre className="mt-3 max-h-72 overflow-auto text-xs">
            {JSON.stringify(pendingImport, null, 2)}
          </pre>
          <button
            disabled={saving}
            onClick={() => save(pendingImport)}
            className="admin-btn admin-btn-primary mt-3"
          >
            {pendingImport.length} kaydı uygula
          </button>
          <button
            onClick={() => setPendingImport([])}
            className="admin-btn admin-btn-secondary ml-2"
          >
            Vazgeç
          </button>
        </section>
      )}
      {data && (
        <section className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Ölçümleme ve veri akışları</h2>
          <p className="mt-2 text-sm">
            Search Console doğrulama kodu:{" "}
            {data.integrations.searchConsole ? "Kayıtlı" : "Eksik"} · GA4
            kimliği: {data.integrations.ga4 ? "Kayıtlı" : "Eksik"} · GTM:{" "}
            {data.integrations.gtm ? "Kayıtlı" : "Tanımlı değil"} · Genel
            indeksleme: {data.integrations.indexing ? "Açık" : "Kapalı"}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-blue-700">
            <a href={data.sitemap} target="_blank" rel="noreferrer">
              Sitemap
            </a>
            <a href={data.feed} target="_blank" rel="noreferrer">
              Merchant ürün feed’i
            </a>
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noreferrer"
            >
              Search Console
            </a>
            <a
              href="https://merchants.google.com"
              target="_blank"
              rel="noreferrer"
            >
              Merchant teşhisleri
            </a>
            <a
              href="https://pagespeed.web.dev/"
              target="_blank"
              rel="noreferrer"
            >
              PageSpeed Insights
            </a>
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noreferrer"
            >
              Rich Results Test
            </a>
            <a
              href="https://validator.schema.org/"
              target="_blank"
              rel="noreferrer"
            >
              Schema Validator
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Kimliğin kayıtlı olması Google hesabında doğrulama veya veri
            alındığı anlamına gelmez. Google hesaplarında sitemap/feed
            bağlantısını ve organik satış raporlarını kontrol edin. Core Web
            Vitals hedefleri: LCP ≤ 2,5 sn, INP ≤ 200 ms, CLS ≤ 0,1; gerçek
            kullanıcıların 75. yüzdeliğinde ölçülür.
          </p>
        </section>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          aria-label="SEO kayıtlarında ara"
          placeholder="Ürün / kategori / sayfa ara"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-lg border p-2"
        />
        <select
          aria-label="Kayıt türü"
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          className="rounded-lg border p-2"
        >
          <option value="all">Tümü</option>
          <option value="product">Ürünler</option>
          <option value="category">Kategoriler</option>
          <option value="page">İçerik sayfaları</option>
          <option value="brand">Markalar</option>
          <option value="blog">Blog yazıları</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={issuesOnly}
            onChange={(event) => setIssuesOnly(event.target.checked)}
          />
          Eksik / uyarılı kayıtlar
        </label>
      </div>
      {selected && (
        <section className="space-y-4">
          <h2 className="font-semibold">{selected.title}</h2>
          {selected.kind !== "product" && (
            <label className="block text-sm">
              Ana görsel ALT açıklaması
              <input
                value={selected.metadata.image_alt || ""}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    metadata: {
                      ...selected.metadata,
                      image_alt: event.target.value,
                    },
                  })
                }
                className="mt-1 w-full rounded-lg border p-2"
              />
            </label>
          )}
          {selected.kind === "product" && (
            <label className="block text-sm">
              Tamamlayıcı ürünler
              <select
                multiple
                aria-label="Tamamlayıcı ürünleri seç"
                className="mt-2 block h-36 w-full rounded-lg border p-2"
                value={selected.metadata.complementary_product_ids || []}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    metadata: {
                      ...selected.metadata,
                      complementary_product_ids: Array.from(
                        event.target.selectedOptions
                      ).map((option) => option.value),
                    },
                  })
                }
              >
                {data.rows
                  .filter(
                    (row: any) =>
                      row.kind === "product" &&
                      row.id !== selected.id &&
                      row.status === "published"
                  )
                  .map((row: any) => (
                    <option key={row.id} value={row.id}>
                      {row.title}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {["category", "brand"].includes(selected.kind) && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.metadata.is_indexable === true}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    metadata: {
                      ...selected.metadata,
                      is_indexable: event.target.checked,
                    },
                  })
                }
              />
              Bu sayfa için arama motoru indekslemesini aç (boş kategoriler
              indekslenmez)
            </label>
          )}
          <SeoFields
            previewTitle={selected.seoTitle}
            previewDescription={selected.seoDescription}
            title={selected.title}
            description={plainText(selected.summary || selected.description)}
            images={selected.kind === "product" ? selected.images : []}
            value={selected.metadata}
            onChange={(metadata) => setSelected({ ...selected, metadata })}
          />
          {selected.kind === "category" && (
            <>
              <label className="block text-sm">
                Kategori görsel ALT metni
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  value={selected.metadata.image_alt || ""}
                  onChange={(event) =>
                    setSelected({
                      ...selected,
                      metadata: {
                        ...selected.metadata,
                        image_alt: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                Kategori alt açıklaması
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-lg border p-2"
                  value={selected.metadata.lower_description || ""}
                  onChange={(event) =>
                    setSelected({
                      ...selected,
                      metadata: {
                        ...selected.metadata,
                        lower_description: event.target.value,
                      },
                    })
                  }
                />
              </label>
            </>
          )}
          {selected.kind === "product" &&
            ["model", "mpn", "google_product_category"].map((key) => (
              <label className="block text-sm" key={key}>
                {
                  (
                    {
                      model: "Model",
                      mpn: "Üretici parça numarası (MPN)",
                      google_product_category:
                        "Google ürün kategorisi ID / yolu",
                    } as any
                  )[key]
                }
                <input
                  value={selected.metadata[key] || ""}
                  onChange={(event) =>
                    setSelected({
                      ...selected,
                      metadata: {
                        ...selected.metadata,
                        [key]: event.target.value,
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-2"
                />
              </label>
            ))}
          <div className="flex gap-3">
            <button
              disabled={saving}
              onClick={() =>
                save([
                  {
                    kind: selected.kind,
                    id: selected.id,
                    metadata: selected.metadata,
                  },
                ])
              }
              className="admin-btn admin-btn-primary"
            >
              SEO ayarlarını kaydet
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setSelected(null)}
            >
              Kapat
            </button>
            <Link
              href={selected.editUrl}
              className="admin-btn admin-btn-secondary"
            >
              İçeriği düzenle
            </Link>
          </div>
          <details className="rounded-xl border p-4">
            <summary>Schema veri önizlemesi</summary>
            <pre className="mt-3 max-h-80 overflow-auto text-xs">
              {JSON.stringify(selected.schema, null, 2)}
            </pre>
          </details>
          <details className="rounded-xl border p-4">
            <summary>SEO değişiklik geçmişi</summary>
            <pre className="mt-3 max-h-80 overflow-auto text-xs">
              {JSON.stringify(selected.metadata.seo_history || [], null, 2)}
            </pre>
          </details>
        </section>
      )}
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">Kayıt</th>
              <th className="p-3">SEO başlığı / açıklaması</th>
              <th className="p-3">Kontrol</th>
              <th className="p-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={`${row.kind}:${row.id}`} className="border-t">
                <td className="p-3">
                  <strong>{row.title}</strong>
                  <p className="text-xs text-slate-500">
                    {row.kind} · {row.status}
                  </p>
                  <a
                    className="text-xs text-blue-700"
                    href={row.path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.path}
                  </a>
                </td>
                <td className="max-w-md p-3">
                  <p>{row.seoTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.seoDescription}
                  </p>
                </td>
                <td className="p-3">
                  {row.issues.length ? (
                    <ul className="space-y-1 text-xs text-amber-800">
                      {row.issues.map((issue: string) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-emerald-700">Eksik alan yok</span>
                  )}
                </td>
                <td className="p-3">
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => {
                      setSelected({ ...row, metadata: { ...row.metadata } })
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                  >
                    Düzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
