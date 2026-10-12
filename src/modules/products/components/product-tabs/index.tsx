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
  const [activeTab, setActiveTab] = useUrlState<string>("aciklama", "product_tab", ["aciklama", "taksit", "sss", "yorumlar"], false)
  const md = (product.metadata as Record<string, any>) || {}
  const { cheapestPrice } = getProductPrice({ product })
  const finalPrice = price || cheapestPrice?.calculated_price_number || 0

  useEffect(() => {
    const handleHashChange = (event?: Event) => {
      const reload = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload"
      const scroll = () => { if (event || !reload) document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth" }) }
      const legacyFeatures = new URL(window.location.href).searchParams.get("product_tab") === "ozellikler"
      const hash = event instanceof CustomEvent ? `#${event.detail}` : window.location.hash || (legacyFeatures ? "#urun-ozellikleri" : "")
      if (hash === "#aciklama" || hash === "#urun-aciklamasi") {
        setActiveTab("aciklama")
        setTimeout(() => {
          scroll()
        }, 50)
      } else if (hash === "#yorumlar" || hash === "#degerlendir" || hash === "#sorular") {
        setActiveTab("yorumlar")
        setTimeout(() => {
          scroll()
        }, 50)
      } else if (hash === "#ozellikler" || hash === "#teknik" || hash === "#urun-ozellikleri") {
        setActiveTab("aciklama")
        setTimeout(() => { if (event || !reload) document.getElementById("urun-ozellikleri")?.scrollIntoView({ behavior: "smooth" }) }, 50)
      } else if (hash === "#sss" || hash === "#sikca-sorulan-sorular") {
        setActiveTab("sss")
        setTimeout(scroll, 50)
      } else if (hash === "#taksit" || hash === "#taksit-secenekleri") {
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
    const sections: Record<string, string> = { aciklama: "urun-aciklamasi", taksit: "taksit-secenekleri", sss: "sikca-sorulan-sorular" }
    const url = new URL(window.location.href)
    url.searchParams.delete("product_tab")
    url.hash = sections[tabKey] || tabKey
    if (url.href !== window.location.href) window.history.pushState(window.history.state, "", url)
  }

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
        {/* Description, installments and frequently asked questions. */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div role="tablist" aria-label="Ürün detayları" className="flex items-center gap-1 overflow-x-auto rounded-t-xl border-b border-slate-200 bg-slate-50/70 px-1 pt-1 no-scrollbar">
            {[["aciklama", "Ürün Açıklaması"], ["taksit", "Taksit Seçenekleri"], ...(faqContent ? [["sss", "Sıkça Sorulan Sorular"]] : [])].map(([key, label]) => (
              <button key={key} id={`product-tab-${key}`} type="button" role="tab" aria-selected={activeTab === key} aria-controls={`product-panel-${key}`} onClick={() => handleTabClick(key)}
                className={clx("shrink-0 whitespace-nowrap rounded-t-lg border-b-[3px] px-3 py-3 text-sm font-extrabold transition sm:text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset", activeTab === key ? "border-primary bg-primary/10 text-primary" : "border-transparent text-slate-800 hover:bg-white hover:text-primary")}>{label}</button>
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
                  <section aria-labelledby="product-usage-heading" className="product-usage-section">
                    <h2 id="product-usage-heading">{usageTitle || "Kullanım ve Sunum Önerileri"}</h2>
                    <div className="product-rich-text prose prose-sm max-w-none text-sm leading-7 text-slate-700 prose-headings:text-slate-900 prose-a:text-[#A95E5E]" dangerouslySetInnerHTML={{ __html: usageContent }} />
                  </section>
                )}
              </div></section>
            )}

            {faqContent && <section id="product-panel-sss" role="tabpanel" aria-labelledby="product-tab-sss" hidden={activeTab !== "sss"}>
              <ProductFaq html={faqContent} productId={product.id} />
            </section>}

            {activeTab === "taksit" && (
              <div id="product-panel-taksit" role="tabpanel" aria-labelledby="product-tab-taksit" className="space-y-4">
                <ProductInstallments price={finalPrice} showHeading={false} />
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
