"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, Headphones, Mail, Package, Search } from "lucide-react"
import { AppIcon } from "@lib/icons"
import { SellerQuestionButton } from "@components/common/SellerQuestion"
import type { FaqCategory, FaqEntry } from "@lib/content/knowledge-pages"

// Keep every answer in the rendered page so category and search content is crawlable.
const ITEMS_PER_PAGE = 100

export default function FaqContent({ content }: { content: Record<string, any> }) {
  const categories = (content.faq_categories || []) as FaqCategory[]
  const items = (content.faq_items || []) as FaqEntry[]
  
  const [activeCategory, setActiveCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  // Compute question counts per category for UI badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((item) => {
      if (item.active !== false) {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1
      }
    })
    return counts
  }, [items])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return items
      .filter((item) => {
        if (item.active === false) return false
        if (activeCategory && item.category_id !== activeCategory) return false
        if (q) {
          const matchQ = item.question.toLowerCase().includes(q)
          const matchA = item.answer.toLowerCase().includes(q)
          return matchQ || matchA
        }
        return true
      })
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [items, activeCategory, searchQuery])

  const paginatedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount)
  }, [filteredItems, visibleCount])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4 sm:space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 sm:left-4 top-1/2 h-4 sm:h-5 w-4 sm:w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setVisibleCount(ITEMS_PER_PAGE)
            }}
            placeholder="Sorularda ara (ör. yemek takımı, nevresim, kargo, iade...)"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 sm:py-3.5 pl-10 sm:pl-12 pr-16 text-xs sm:text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:border-[#C98484] focus:outline-hidden focus:ring-2 focus:ring-rose-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Mobile Category Dropdown (Visible on Phones) */}
        <div className="block sm:hidden">
          <label htmlFor="mobile-category-select" className="sr-only">Kategori Seçin</label>
          <div className="relative">
            <select
              id="mobile-category-select"
              value={activeCategory}
              onChange={(e) => {
                setActiveCategory(e.target.value)
                setVisibleCount(ITEMS_PER_PAGE)
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-8 text-xs font-extrabold text-slate-800 shadow-xs appearance-none focus:border-[#C98484] focus:outline-none"
            >
              <option value="">Tüm sorular ({items.filter((item) => item.active !== false).length})</option>
              {[...categories]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((cat) => {
                  const count = categoryCounts[cat.id] || 0
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.title} {count > 0 ? `(${count})` : ""}
                    </option>
                  )
                })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Categories Horizontal Scroll Tabs (Visible on Tablet & Desktop) */}
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveCategory("")
              setVisibleCount(ITEMS_PER_PAGE)
            }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-extrabold transition ${
              !activeCategory
                ? "border-[#C98484] bg-rose-50 text-[#C98484] shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:border-rose-200"
            }`}
          >
            Tüm sorular ({items.filter((item) => item.active !== false).length})
          </button>
          {[...categories]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((category) => {
              const count = categoryCounts[category.id] || 0
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.id)
                    setVisibleCount(ITEMS_PER_PAGE)
                  }}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-extrabold transition ${
                    activeCategory === category.id
                      ? "border-[#C98484] bg-rose-50 text-[#C98484] shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-rose-200"
                  }`}
                >
                  <AppIcon name={category.icon} className="h-4 w-4" />
                  <span>{category.title}</span>
                  {count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeCategory === category.id ? "bg-[#C98484] text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
        </div>

        {/* Question Counter Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>
            {searchQuery
              ? `"${searchQuery}" için ${filteredItems.length} sonuç bulundu`
              : `${filteredItems.length} Soru Listeleniyor`}
          </span>
          {filteredItems.length > visibleCount && (
            <span className="hidden sm:inline">Gösterilen: 1 - {visibleCount}</span>
          )}
        </div>

        {/* Accordion Questions List */}
        <section className="space-y-2.5 sm:space-y-3 rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-xs">
          {paginatedItems.length ? (
            paginatedItems.map((item, index) => (
              <details
                key={item.id}
                open={index === 0 && !searchQuery}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-rose-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2.5 px-3.5 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                  <span className="leading-5 sm:leading-6">{item.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180 group-open:text-[#C98484]" />
                </summary>
                <div className="border-t border-slate-100 bg-slate-50/60 px-3.5 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm leading-6 sm:leading-7 text-slate-600">
                  <p>{item.answer}</p>
                  
                  {/* Action Link Button for Google & Product Routing */}
                  <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <span className="text-[11px] sm:text-xs text-slate-400 font-medium text-center sm:text-left">Orijinal Ürün & Hizmet Güvencesi</span>
                    {item.linkUrl === "/iletisim" ? (
                      <SellerQuestionButton className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2.5 sm:py-2 text-xs font-extrabold text-[#C98484] transition hover:bg-[#C98484] hover:text-white text-center">
                        <span>Satıcıya Sor →</span>
                      </SellerQuestionButton>
                    ) : (
                      <Link
                        href={item.linkUrl || "/magaza"}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2.5 sm:py-2 text-xs font-extrabold text-[#C98484] transition hover:bg-[#C98484] hover:text-white text-center"
                      >
                        <span>{item.linkText || "İlgili Ürünü İncele →"}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </details>
            ))
          ) : (
            <div className="py-8 sm:py-12 text-center">
              <p className="text-xs sm:text-sm font-bold text-slate-700">Aramanıza uygun soru bulunamadı.</p>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">Lütfen arama terimini değiştirin veya destek ekibimizle iletişime geçin.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setActiveCategory("")
                }}
                className="mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white"
              >
                Tüm Soruları Göster
              </button>
            </div>
          )}
        </section>

        {/* Load More Button */}
        {filteredItems.length > visibleCount && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs font-extrabold text-slate-800 shadow-xs transition hover:border-[#C98484] hover:bg-rose-50 hover:text-[#C98484]"
            >
              <span>Daha Fazla Soru Göster ({filteredItems.length - visibleCount} soru kaldı)</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Contact Cards */}
      <aside className="space-y-4 sm:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-rose-50 p-2.5 text-[#C98484]">
              <Headphones className="h-5 w-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900">{content.support_title || "Hızlı Destek"}</h2>
          </div>
          <p className="mt-2.5 text-xs leading-5 text-slate-500">
            {content.support_description || "Cevabını bulamadığınız sorular için bize ulaşabilirsiniz."}
          </p>

          <div className="mt-4">
            <Link href="/iletisim" className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-[#C98484] transition hover:bg-rose-100">
              <Mail className="h-5 w-5" /> İletişim formuna git
            </Link>
          </div>
        </section>

        {/* Order Tracking Widget */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-[#C98484]" />
            <h2 className="text-base font-black text-slate-900">{content.tracking_title || "Sipariş Takibi"}</h2>
          </div>
          <p className="mt-2 text-xs text-slate-500">{content.tracking_description || "Siparişinizi kolayca takip edin."}</p>
          <Link
            href="/siparis-takibi"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C98484] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#A95E5E]"
          >
            Siparişi Takip Et <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </aside>

      {/* Bottom Banner */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center lg:col-span-2">
        <span className="rounded-full bg-rose-50 p-3.5 sm:p-4 text-[#C98484] self-start sm:self-center">
          <Mail className="h-5 sm:h-6 w-5 sm:w-6" />
        </span>
        <div className="flex-1">
          <h2 className="text-sm sm:text-base font-black text-slate-900">{content.bottom_title || "Aradığınız cevabı bulamadınız mı?"}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {content.bottom_description || "Uzman ekibimiz sorularınızı yanıtlamak için her zaman yanınızda."}
          </p>
        </div>
        <SellerQuestionButton
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-xs font-extrabold text-slate-800 transition hover:border-[#C98484] hover:text-[#C98484]"
        >
          Satıcıya Sor <ArrowRight className="h-4 w-4" />
        </SellerQuestionButton>
      </section>
    </div>
  )
}
