"use client"
import { useEffect, useState } from "react"
import { productSeo } from "@lib/seo/entity"

export default function SeoFields({
  value,
  onChange,
  title,
  description,
  images = [],
  previewTitle,
  previewDescription,
}: {
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
  title: string
  description?: string
  images?: string[]
  previewTitle?: string
  previewDescription?: string
}) {
  const [settings, setSettings] = useState<Record<string, any>>({})
  useEffect(() => {
    if (previewTitle !== undefined) return
    const controller = new AbortController()
    fetch("/api/admin/theme-settings", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result?.settings) setSettings(result.settings)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [previewTitle])
  const generated = productSeo(
    {
      title,
      description,
      metadata: { ...value, product_summary: description },
    },
    settings
  )
  const set = (key: string, entry: unknown) =>
    onChange({ ...value, [key]: entry })
  const field = (key: string, label: string, placeholder = "") => (
    <label className="block space-y-1 text-sm" key={key}>
      <span className="font-medium text-slate-700">{label}</span>
      <input
        value={value[key] || ""}
        onChange={(event) => set(key, event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 p-2.5"
      />
    </label>
  )
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">SEO ve sosyal paylaşım</h2>
      <p className="text-xs text-slate-500">
        Boş SEO başlığı ve açıklaması gerçek ürün içeriğinden ve kayıtlı
        şablondan oluşturulur. Yazdığınız değerler korunur.
      </p>
      {field("seo_title", "SEO başlığı", title)}
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Meta açıklaması</span>
        <textarea
          rows={3}
          value={value.seo_description || ""}
          onChange={(event) => set("seo_description", event.target.value)}
          placeholder={description || "Ürüne özel arama sonucu açıklaması"}
          className="w-full rounded-lg border border-slate-200 p-2.5"
        />
      </label>
      {field("h1_title", "Sayfada görünen ana başlık (H1)", title)}
      {field(
        "seo_canonical",
        "Canonical URL",
        "Boş bırakıldığında sayfanın kendi adresi"
      )}
      {field("og_title", "Sosyal paylaşım başlığı", title)}
      {field("og_image", "Sosyal paylaşım görsel adresi")}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.seo_noindex === true}
          onChange={(event) => set("seo_noindex", event.target.checked)}
        />
        Arama sonuçlarına dahil etme (noindex)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.seo_sitemap !== false}
          onChange={(event) => set("seo_sitemap", event.target.checked)}
        />
        Sitemap’e dahil et (indekslenebilir sayfalarda)
      </label>
      {images.map((url, index) => (
        <label className="block text-sm" key={url}>
          <span>{index + 1}. görselin ALT açıklaması</span>
          <input
            value={value.image_alt_texts?.[url] || ""}
            placeholder={title}
            onChange={(event) =>
              set("image_alt_texts", {
                ...value.image_alt_texts,
                [url]: event.target.value,
              })
            }
            className="mt-1 w-full rounded-lg border border-slate-200 p-2.5"
          />
        </label>
      ))}
      <div className="rounded-xl bg-slate-50 p-4">
        <span className="text-xs text-slate-500">Arama sonucu önizlemesi</span>
        <p className="mt-2 font-medium text-blue-800">
          {value.seo_title || previewTitle || generated.title}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {value.seo_description || previewDescription || generated.description}
        </p>
      </div>
    </section>
  )
}
