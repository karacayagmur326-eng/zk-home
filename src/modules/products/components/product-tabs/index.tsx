"use client"

import { useUrlState } from "@lib/hooks/use-url-state"

import { HttpTypes } from "@medusajs/types"
import { useEffect } from "react"
import clx from "clsx"
import ProductReviews from "@modules/products/components/product-reviews"
import { sanitizeRichTextHtml } from "@modules/common/components/rich-text-editor"
import ProductFaq from "./product-faq"
import { splitProductFaq } from "@lib/util/product-faq"
import ProductInstallments from "@modules/products/components/product-installments"
import { getProductPrice } from "@lib/util/get-product-price"
import { formatProductLabels } from "@lib/util/format-product-labels"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  price?: number
}

const ProductTabs = ({ product, price }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useUrlState<string>("aciklama", "product_tab", ["aciklama", "ozellikler", "taksit", "sss", "yorumlar"], false)
  const md = (product.metadata as Record<string, any>) || {}
  const { cheapestPrice } = getProductPrice({ product })
  const finalPrice = price || cheapestPrice?.calculated_price_number || 0

  useEffect(() => {
    const handleHashChange = (event?: Event) => {
      const reload = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload"
      if (reload && !event) return
      const scroll = () => { if (event || !reload) document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth" }) }
      const hash = event instanceof CustomEvent ? `#${event.detail}` : window.location.hash
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
      } else if (hash === "#sss") {
        setActiveTab("sss")
        setTimeout(scroll, 50)
      } else if (hash === "#taksit") {
        setActiveTab("taksit")
        setTimeout(() => {
          scroll()
        }, 50)
      }
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    window.addEventListener("product:section", handleHashChange)
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
      window.removeEventListener("product:section", handleHashChange)
    }
  }, [])

  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey)
  }

  const featuresContent =
    typeof md.features_content === "string"
      ? formatProductLabels(sanitizeRichTextHtml(md.features_content).replace(/<(\/?)h1\b/gi, "<$1h2").trim())
      : ""
  const usageTitle = typeof md.usage_title === "string" ? md.usage_title.trim() : ""
  const rawUsage = typeof md.usage_content === "string" ? md.usage_content.trim() : ""
  const legacyUsage = splitProductFaq(rawUsage)
  const faqContent = sanitizeRichTextHtml(typeof md.faq_content === "string" ? md.faq_content : legacyUsage.faq)
  const usageContent = sanitizeRichTextHtml(/<[^>]+>/.test(legacyUsage.usage)
    ? legacyUsage.usage
    : legacyUsage.usage.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p>${paragraph.replace(/\r\n?|\n/g, "<br />")}</p>`).join("")
  ).replace(/<(\/?)h1\b/gi, "<$1h2")
  const rawDescription =
    typeof product.description === "string" ? product.description : ""
  const descriptionWithPreservedLines =
    /<(?:p|div|br|li|h[1-6])\b/i.test(rawDescription)
      ? rawDescription
      : rawDescription.replace(/\r\n?|\n/g, "<br />")
  const descriptionContent =
    rawDescription
      ? formatProductLabels(sanitizeRichTextHtml(descriptionWithPreservedLines).replace(/<(\/?)h1\b/gi, "<$1h2").trim())
      : ""

  return (
    <div id="product-tabs" className="w-full pt-4 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* ── LEFT COLUMN (6 cols): TABS & TAB CONTENT (Açıklama, Özellikler, Taksit) ── */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div role="tablist" aria-label="Ürün detayları" className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-3 no-scrollbar">
            {[["aciklama", "Ürün Açıklaması"], ["ozellikler", "Özellikler"], ["taksit", "Taksit"], ...(faqContent ? [["sss", "Sıkça Sorulan Sorular"]] : [])].map(([key, label]) => (
              <button key={key} id={`product-tab-${key}`} type="button" role="tab" aria-selected={activeTab === key} aria-controls={`product-panel-${key}`} onClick={() => handleTabClick(key)}
                className={clx("shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm", activeTab === key ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50")}>{label}</button>
            ))}
          </div>

          {/* Tab Content Panel */}
          <div className="pt-2 sm:pt-3">
            {(
              <section id="product-panel-aciklama" role="tabpanel" hidden={activeTab !== "aciklama"} aria-labelledby="product-tab-aciklama" className="product-content-template">
              <div className="space-y-4">
                {descriptionContent ? (
                  <div
                    className="product-rich-text prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-headings:font-extrabold prose-a:text-[#A95E5E] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: descriptionContent }}
                  />
                ) : (
null
                )}
                {usageContent && (
                  <section aria-labelledby="product-usage-heading" className="mt-6 border-t border-[#eadfda] pt-6">
                    <h2 id="product-usage-heading" className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">{usageTitle || "Kullanım ve Sunum Önerileri"}</h2>
                    <div className="product-rich-text prose prose-sm max-w-none text-sm leading-7 text-slate-700 prose-headings:text-slate-900 prose-a:text-[#A95E5E]" dangerouslySetInnerHTML={{ __html: usageContent }} />
                  </section>
                )}
              </div></section>
            )}

            {(
              <section id="product-panel-ozellikler" role="tabpanel" hidden={activeTab !== "ozellikler"} aria-labelledby="product-tab-ozellikler" className="product-content-template product-specifications">
                <h2 id="product-specs-heading" className="mb-3 text-base font-semibold">Ürün Özellikleri</h2>
                {!featuresContent && <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">{[["Marka", md.brand_name || product.collection?.title || md.brand], ["Model", md.model], ["Üretici parça numarası", md.mpn]].filter(([, value]) => value).map(([label, value]) => <div key={String(label)} className="contents"><dt className="font-medium">{String(label)}</dt><dd>{String(value)}</dd></div>)}</dl>}
              <div className="space-y-4">
                {featuresContent ? (
                  <div
                    className="product-rich-text prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-a:text-[#A95E5E]"
                    dangerouslySetInnerHTML={{ __html: featuresContent }}
                  />
                ) : (
null
                )}
              </div>
                {Array.isArray(md.tech_specs) && md.tech_specs.length > 0 && <table className="mt-4 w-full text-sm"><tbody>{md.tech_specs.filter((spec: any) => spec.key && spec.value).map((spec: any, index: number) => <tr key={index} className="border-b border-slate-100"><th scope="row" className="p-2 text-left font-medium">{spec.key}</th><td className="p-2">{spec.value}</td></tr>)}</tbody></table>}
              </section>
            )}

            {faqContent && <section id="product-panel-sss" role="tabpanel" aria-labelledby="product-tab-sss" hidden={activeTab !== "sss"}>
              <ProductFaq html={faqContent} productId={product.id} />
            </section>}

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
