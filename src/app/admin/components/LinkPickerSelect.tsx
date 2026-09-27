"use client"

import React, { useEffect, useState } from "react"
import { RefreshCw } from "@lib/icons"

export interface LinkOption {
  label: string
  url: string
  icon?: string
  image?: string
}

export const SITE_PAGES: LinkOption[] = [
  { label: "Ana Sayfa", url: "/" },
  { label: "Hakkımızda", url: "/hakkimizda" },
  { label: "İletişim", url: "/iletisim" },
  { label: "Mağaza & Ürünler", url: "/magaza" },
  { label: "Sepetim", url: "/sepet" },
  { label: "Hesabım", url: "/hesabim" },
  { label: "Favorilerim", url: "/favorilerim" },
  { label: "Son Gezilenler", url: "/son-gezdiklerim" },
  { label: "Mesafeli Satış Sözleşmesi", url: "/mesafeli-satis-sozlesmesi" },
  { label: "Ön Bilgilendirme Formu", url: "/on-bilgilendirme-formu" },
  { label: "Gizlilik Politikası", url: "/gizlilik-politikasi" },
  { label: "Çerez Politikası", url: "/cerez-politikasi" },
  { label: "Teslimat ve İade", url: "/teslimat-ve-iade" },
  { label: "Garanti ve Teknik Servis", url: "/garanti-ve-teknik-servis" },
  { label: "Kullanım Koşulları", url: "/kullanim-kosullari" },
  { label: "Sıkça Sorulan Sorular (SSS)", url: "/sss" },
  { label: "Blog", url: "/blog" },
  { label: "Toptan Satış", url: "/toptan-satis" },
]

interface LinkPickerSelectProps {
  label: string
  value: string
  onChange: (url: string, autoData?: { label?: string; icon?: string; image?: string }) => void
  onAutoSync?: (autoData: { label?: string; icon?: string; image?: string }) => void
  placeholder?: string
}

export default function LinkPickerSelect({
  label,
  value,
  onChange,
  onAutoSync,
}: LinkPickerSelectProps) {
  const [categories, setCategories] = useState<LinkOption[]>([])
  const [collections, setCollections] = useState<LinkOption[]>([])
  const [brands, setBrands] = useState<LinkOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      fetch("/api/admin/categories").then((r) => (r.ok ? r.json() : { categories: [] })),
      fetch("/api/catalog/navigation").then((r) => (r.ok ? r.json() : {})),
      fetch("/api/admin/brands-settings").then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([catRes, navRes, brandRes]) => {
        if (!isMounted) return

        const navData = (navRes || {}) as { categories?: any[]; collections?: any[] }
        const brandData = (brandRes || {}) as { brands?: any[]; items?: any[] }
        const catData = (catRes || {}) as { categories?: any[] }

        // Process categories and extract saved icon or image URL
        const catList: LinkOption[] = []
        const rawCats = catData.categories || navData.categories || []
        for (const cat of rawCats) {
          const url = `/kategoriler/${cat.handle || cat.id}`
          const image =
            cat.metadata?.card_image_url ||
            cat.metadata?.image_url ||
            cat.metadata?.hero_image_url ||
            cat.metadata?.banner_url ||
            ""
          const icon =
            cat.metadata?.icon ||
            (cat.metadata?.badge_icon !== "check" ? cat.metadata?.badge_icon : "") ||
            cat.icon ||
            ""
          catList.push({
            label: cat.name || cat.title || cat.handle,
            url,
            icon,
            image,
          })
        }
        setCategories(catList)

        // Process collections
        const colList: LinkOption[] = []
        const rawCols = navData.collections || []
        for (const col of rawCols) {
          colList.push({
            label: col.title || col.name,
            url: `/magaza?collection=${col.handle || col.id}`,
          })
        }
        setCollections(colList)

        // Process brands
        const brandList: LinkOption[] = []
        const rawBrands = brandData.brands || brandData.items || []
        for (const b of rawBrands) {
          if (b.name) {
            brandList.push({
              label: b.name,
              url: `/markalar/${b.slug || b.handle || b.name.toLowerCase().replace(/\s+/g, "-")}`,
              icon: b.logo_url || b.image_url || "",
            })
          }
        }
        setBrands(brandList)

        // Auto-sync initial value icon if matched
        const all = [...catList, ...colList, ...brandList, ...SITE_PAGES]
        const matchedInitial = all.find(
          (opt) => opt.url === value || (value && (value.endsWith(opt.url) || opt.url.endsWith(value)))
        )
        if (matchedInitial && (matchedInitial.icon || matchedInitial.image) && onAutoSync) {
          onAutoSync({ label: matchedInitial.label, icon: matchedInitial.icon, image: matchedInitial.image })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const allKnownOptions = [...categories, ...collections, ...brands, ...SITE_PAGES]

  const findMatched = (urlVal: string) => {
    if (!urlVal) return undefined
    return allKnownOptions.find(
      (opt) =>
        opt.url === urlVal ||
        opt.url.toLowerCase() === urlVal.toLowerCase() ||
        urlVal.endsWith(opt.url) ||
        opt.url.endsWith(urlVal)
    )
  }

  const selectedOption = findMatched(value)
  const isCustom = !selectedOption && Boolean(value)

  const handleSelectChange = (newUrl: string) => {
    if (newUrl === "custom") {
      onChange(value || "")
      return
    }
    const matched = findMatched(newUrl)
    onChange(newUrl, matched ? { label: matched.label, icon: matched.icon, image: matched.image } : undefined)
  }

  const handleManualSync = () => {
    const matched = findMatched(value)
    if (matched) {
      onChange(value, { label: matched.label, icon: matched.icon, image: matched.image })
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>

      <div className="flex items-center gap-2">
        {!isCustom ? (
          <div className="relative flex-1">
            <select
              value={selectedOption ? selectedOption.url : "custom"}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-xs text-slate-900 focus:outline-none focus:border-[#C98484] cursor-pointer"
            >
              {categories.length > 0 && (
                <optgroup label="🏷️ Sitenin Ürün Kategorileri">
                  {categories.map((cat) => (
                    <option key={cat.url} value={cat.url}>
                      {cat.label}
                    </option>
                  ))}
                </optgroup>
              )}

              {brands.length > 0 && (
                <optgroup label="⚡ Sitenin Markaları">
                  {brands.map((brand) => (
                    <option key={brand.url} value={brand.url}>
                      {brand.label}
                    </option>
                  ))}
                </optgroup>
              )}

              {collections.length > 0 && (
                <optgroup label="📦 Sitenin Koleksiyonları">
                  {collections.map((col) => (
                    <option key={col.url} value={col.url}>
                      {col.label}
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label="📄 Sabit Mağaza Sayfaları">
                {SITE_PAGES.map((page) => (
                  <option key={page.url} value={page.url}>
                    {page.label}
                  </option>
                ))}
              </optgroup>

              <option value="custom">✍️ Özel Bağlantı / Dış Link Girin...</option>
            </select>
          </div>
        ) : (
          <div className="relative flex-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://... veya /kategoriler/..."
              className="w-full bg-white border border-[#C98484] rounded-xl px-3 py-2.5 font-bold text-xs text-slate-900 focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {(selectedOption?.icon || selectedOption?.image) && (
          <button
            type="button"
            onClick={handleManualSync}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-extrabold text-[#D94F00] transition-colors hover:bg-rose-100"
            title="Kategori adı, ikonu ve görseliyle eşitle"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Eşitle</span>
          </button>
        )}

        {isCustom ? (
          <button
            type="button"
            onClick={() => handleSelectChange(SITE_PAGES[0].url)}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer flex-shrink-0"
          >
            Listeye Dön
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSelectChange("custom")}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer flex-shrink-0"
          >
            Özel URL
          </button>
        )}
      </div>
    </div>
  )
}
