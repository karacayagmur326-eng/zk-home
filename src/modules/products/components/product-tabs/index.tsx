"use client"

import { useUrlState } from "@lib/hooks/use-url-state"

import { HttpTypes } from "@medusajs/types"
import { useState, useEffect } from "react"
import clx from "clsx"
import ProductReviews from "@modules/products/components/product-reviews"
import { sanitizeRichTextHtml } from "@modules/common/components/rich-text-editor"
import ProductInstallments from "@modules/products/components/product-installments"
import { getProductPrice } from "@lib/util/get-product-price"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  price?: number
}

const ProductTabs = ({ product, price }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useUrlState<string>("aciklama", "product_tab", ["aciklama", "ozellikler", "taksit", "yorumlar"])
  const md = (product.metadata as Record<string, any>) || {}
  const { cheapestPrice } = getProductPrice({ product })
  const finalPrice = price || cheapestPrice?.calculated_price_number || 0

  useEffect(() => {
    const handleHashChange = (event?: Event) => {
      const reload = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload"
      if (reload && !event) return
      const scroll = () => { if (event || !reload) document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth" }) }
      const hash = window.location.hash
      if (hash === "#aciklama") {
        setActiveTab("aciklama")
        setTimeout(() => {
          scroll()
        }, 50)
      } else if (hash === "#yorumlar" || hash === "#degerlendir" || hash === "#sorular") {
        setActiveTab("yorumlar")
        setTimeout(() => {
          scroll()
        }, 50)
      } else if (hash === "#ozellikler" || hash === "#teknik") {
        setActiveTab("ozellikler")
        setTimeout(() => {
          scroll()
        }, 50)
      } else if (hash === "#taksit") {
        setActiveTab("taksit")
        setTimeout(() => {
          scroll()
        }, 50)
      }
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey)
    if (typeof window !== "undefined") {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search + `#${tabKey}`
      )
    }
  }

  const reviewsCount =
    md.review_count !== undefined
      ? Number(md.review_count)
      : Array.isArray(md.reviews)
        ? md.reviews.length
        : 0

  const featuresContent =
    typeof md.features_content === "string"
      ? sanitizeRichTextHtml(md.features_content).replace(/<(\/?)h1\b/gi, "<$1h2").trim()
      : ""
  const usageTitle = typeof md.usage_title === "string" ? md.usage_title.trim() : ""
  const usageParagraphs = typeof md.usage_content === "string"
    ? md.usage_content.trim().split(/\n\s*\n/).filter(Boolean)
    : []
  const rawDescription =
    typeof product.description === "string" ? product.description : ""
  const descriptionWithPreservedLines =
    /<(?:p|div|br|li|h[1-6])\b/i.test(rawDescription)
      ? rawDescription
      : rawDescription.replace(/\r\n?|\n/g, "<br />")
  const descriptionContent =
    rawDescription
      ? sanitizeRichTextHtml(descriptionWithPreservedLines).replace(/<(\/?)h1\b/gi, "<$1h2").trim()
      : ""

  return (
    <div id="product-tabs" className="w-full pt-4 font-sans">
      <p className="mb-4 text-sm"><a className="text-[#A95E5E] underline" href="/teslimat-ve-iade">Teslimat, iptal ve iade koşulları</a></p>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* ── LEFT COLUMN (6 cols): TABS & TAB CONTENT (Açıklama, Özellikler, Taksit) ── */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {/* Mobile Version: 3-column Segmented Pill Bar */}
          <div className="sm:hidden grid grid-cols-3 divide-x divide-slate-200/90 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabClick("aciklama")}
              className={clx(
                "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-95",
                activeTab === "aciklama"
                  ? "bg-[#C98484] text-white font-extrabold shadow-2xs"
                  : "text-slate-700 hover:bg-rose-50/80 hover:text-[#C98484] font-bold"
              )}
            >
              <span className="text-xs leading-none">Açıklama</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("ozellikler")}
              className={clx(
                "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-95",
                activeTab === "ozellikler"
                  ? "bg-[#C98484] text-white font-extrabold shadow-2xs"
                  : "text-slate-700 hover:bg-rose-50/80 hover:text-[#C98484] font-bold"
              )}
            >
              <span className="text-xs leading-none">Özellikler</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("taksit")}
              className={clx(
                "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-95",
                activeTab === "taksit"
                  ? "bg-[#C98484] text-white font-extrabold shadow-2xs"
                  : "text-slate-700 hover:bg-rose-50/80 hover:text-[#C98484] font-bold"
              )}
            >
              <span className="text-xs leading-none">Taksit</span>
            </button>
          </div>

          {/* Desktop Version: Line Tab Bar (Aligned at Top with Right Column) */}
          <div className="hidden sm:flex no-scrollbar items-center gap-6 sm:gap-8 overflow-x-auto border-b border-slate-200 pb-0">
            <button
              type="button"
              onClick={() => handleTabClick("aciklama")}
              className={clx(
                "pb-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 -mb-px",
                activeTab === "aciklama"
                  ? "border-[#C98484] text-[#C98484] font-extrabold"
                  : "border-transparent text-slate-700 hover:text-slate-900"
              )}
            >
              Açıklama
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("ozellikler")}
              className={clx(
                "pb-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 -mb-px",
                activeTab === "ozellikler"
                  ? "border-[#C98484] text-[#C98484] font-extrabold"
                  : "border-transparent text-slate-700 hover:text-slate-900"
              )}
            >
              Özellikler
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("taksit")}
              className={clx(
                "pb-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 -mb-px",
                activeTab === "taksit"
                  ? "border-[#C98484] text-[#C98484] font-extrabold"
                  : "border-transparent text-slate-700 hover:text-slate-900"
              )}
            >
              Taksit
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="pt-2 sm:pt-3">
            {(
              <section hidden={activeTab !== "aciklama"} aria-labelledby="product-description-heading">
                <h2 id="product-description-heading" className="mb-3 text-base font-semibold">Ürün Açıklaması</h2>
              <div className="space-y-4">
                {descriptionContent ? (
                  <div
                    className="product-rich-text prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-headings:font-extrabold prose-a:text-[#C98484] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: descriptionContent }}
                  />
                ) : (
null
                )}
                {usageParagraphs.length > 0 && (
                  <section aria-labelledby="product-usage-heading" className="mt-6 border-t border-[#eadfda] pt-6">
                    <h2 id="product-usage-heading" className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">{usageTitle || "Kullanım ve Sunum Önerileri"}</h2>
                    <div className="space-y-3 text-sm leading-7 text-slate-700">
                      {usageParagraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
                    </div>
                  </section>
                )}
              </div></section>
            )}

            {(
              <section hidden={activeTab !== "ozellikler"} aria-labelledby="product-specs-heading">
                <h2 id="product-specs-heading" className="mb-3 text-base font-semibold">Ürün Özellikleri</h2>
                <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">{[["Marka", md.brand_name || product.collection?.title || md.brand], ["Model", md.model], ["Üretici parça numarası", md.mpn]].filter(([, value]) => value).map(([label, value]) => <div key={String(label)} className="contents"><dt className="font-medium">{String(label)}</dt><dd>{String(value)}</dd></div>)}</dl>
              <div className="space-y-4">
                {featuresContent ? (
                  <div
                    className="product-rich-text prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-a:text-[#C98484]"
                    dangerouslySetInnerHTML={{ __html: featuresContent }}
                  />
                ) : (
null
                )}
              </div>
                {Array.isArray(md.tech_specs) && md.tech_specs.length > 0 && <table className="mt-4 w-full text-sm"><tbody>{md.tech_specs.filter((spec: any) => spec.key && spec.value).map((spec: any, index: number) => <tr key={index} className="border-b border-slate-100"><th scope="row" className="p-2 text-left font-medium">{spec.key}</th><td className="p-2">{spec.value}</td></tr>)}</tbody></table>}
              </section>
            )}

            {activeTab === "taksit" && (
              <div className="space-y-4">
                <ProductInstallments price={finalPrice} />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (6 cols): REVIEWS & QUESTIONS (Aligned Top Level) ── */}
        <div className="lg:col-span-6 space-y-6">
          <ProductReviews productId={product.id} layout="column" />
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
