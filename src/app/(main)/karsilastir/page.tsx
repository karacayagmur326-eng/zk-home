"use client"

import { useEffect, useState } from "react"
import Image from "@components/common/SmartImage"
import Link from "next/link"
import {
  ArrowLeftRight,
  Trash2,
  ShoppingCart,
  Check,
  Star,
  ArrowLeft,
  Tag,
  Shield,
  Box,
  Hash,
  Zap,
  Award,
  Sparkles,
  Layers,
  FileText,
  Wrench,
  ChevronDown,
  ChevronUp,
  ListFilter,
  Calculator,
  Gift,
  ShoppingBag,
} from "@lib/icons"
import {
  getCompareList,
  removeFromCompare,
  clearCompareList,
  CompareProduct,
  formatComparePrice,
} from "@lib/util/compare-store"

export default function ComparePage() {
  const [comparedProducts, setComparedProducts] = useState<CompareProduct[]>([])
  const [liveProducts, setLiveProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyDifferences, setOnlyDifferences] = useState(false)
  const [activeNavGroup, setActiveNavGroup] = useState("genel")
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    genel: true,
    fiyat: true,
    teknik: false,
    ozel: false,
    kutu: false,
    garanti: false,
    yorumlar: false,
  })

  const fetchLiveProducts = async (list: CompareProduct[]) => {
    if (!list || list.length === 0) {
      setLiveProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    const ids = list.map((p) => p.id).join(",")

    try {
      const res = await fetch(`/api/catalog/compare?ids=${encodeURIComponent(ids)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.products && data.products.length > 0) {
          setLiveProducts(data.products)
        } else {
          setLiveProducts(list)
        }
      } else {
        setLiveProducts(list)
      }
    } catch {
      setLiveProducts(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const list = getCompareList()
    setComparedProducts(list)
    fetchLiveProducts(list)

    const handleUpdate = (e: any) => {
      const updated = e.detail || getCompareList()
      setComparedProducts(updated)
      fetchLiveProducts(updated)
    }

    window.addEventListener("compare_updated", handleUpdate)
    return () => window.removeEventListener("compare_updated", handleUpdate)
  }, [])

  const handleRemove = (id: string) => {
    const updated = removeFromCompare(id)
    setComparedProducts(updated)
    fetchLiveProducts(updated)
  }

  const handleClearAll = () => {
    clearCompareList()
    setComparedProducts([])
    setLiveProducts([])
  }

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const productsToRender = liveProducts.length > 0 ? liveProducts : comparedProducts

  const productCardsGridClass =
    productsToRender.length === 1
      ? "grid-cols-1"
      : productsToRender.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : productsToRender.length === 3
          ? "grid-cols-1 md:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"

type CompareRowItem = {
  key: string
  label: string
  getValue: (p: any) => any
  isPrice?: boolean
  isStockBadge?: boolean
  isRatingBadge?: boolean
}

  const specSections: Array<{
    id: string
    title: string
    icon: any
    iconBg: string
    rows: CompareRowItem[]
  }> = [
    {
      id: "genel",
      title: "Genel Bilgiler",
      icon: ShoppingBag,
      iconBg: "bg-[#C98484] text-white",
      rows: [
        {
          key: "category",
          label: "Kategori",
          getValue: (p: any) => p.category || "—",
        },
        {
          key: "brand",
          label: "Marka",
          getValue: (p: any) => p.brand || "—",
        },
        {
          key: "sku",
          label: "Stok Kodu (SKU)",
          getValue: (p: any) => p.sku || "—",
        },
        {
          key: "model",
          label: "Model",
          getValue: (p: any) => p.model || p.title,
        },
      ],
    },
    {
      id: "fiyat",
      title: "Fiyat & Satış",
      icon: Tag,
      iconBg: "bg-slate-100 text-slate-700",
      rows: [
        {
          key: "price",
          label: "Fiyat",
          getValue: (p: any) =>
            typeof p.price === "number"
              ? formatComparePrice(p.price)
              : p.formatted_price || p.price || "—",
          isPrice: true,
        },
        {
          key: "stock_status",
          label: "Stok Durumu",
          getValue: (_p: any) => "Stokta Var",
          isStockBadge: true,
        },
        {
          key: "shipping_time",
          label: "Kargo Süresi",
          getValue: (p: any) => p.shipping_time || "1-3 İş Günü",
        },
        {
          key: "warranty",
          label: "Garanti",
          getValue: (p: any) => p.warranty || "2 Yıl Resmi Distribütör",
        },
        {
          key: "installment",
          label: "Taksit Seçeneği",
          getValue: (p: any) => p.installment || "Var",
        },
      ],
    },
    {
      id: "teknik",
      title: "Teknik Özellikler",
      icon: Calculator,
      iconBg: "bg-slate-100 text-slate-700",
      rows: [
        {
          key: "power",
          label: "Motor & Güç",
          getValue: (p: any) => p.power || "1200W Motor",
        },
        {
          key: "usage_type",
          label: "Kullanım Tipi",
          getValue: (_p: any) => "Profesyonel & Atölye",
        },
        {
          key: "body_structure",
          label: "Gövde Yapısı",
          getValue: (_p: any) => "Ergonomik Kauçuk Kaplama",
        },
      ],
    },
    {
      id: "ozel",
      title: "Ürüne Özel Özellikler",
      icon: Sparkles,
      iconBg: "bg-slate-100 text-slate-700",
      rows: [
        {
          key: "speed_setting",
          label: "Hız / Devir Ayarı",
          getValue: (p: any) =>
            (p.title || "").toLowerCase().includes("polisaj")
              ? "6 Kademe Hassas Devir"
              : "Çift Vites Kademesi",
        },
        {
          key: "gear_box",
          label: "Şanzıman Tipi",
          getValue: (_p: any) => "Çelik Dişli Şanzıman",
        },
      ],
    },
    {
      id: "kutu",
      title: "Kutu İçeriği",
      icon: Gift,
      iconBg: "bg-slate-100 text-slate-700",
      rows: [
        {
          key: "box_list",
          label: "Kutu Ürün Listesi",
          getValue: (p: any) =>
            Array.isArray(p.box_content)
              ? p.box_content.join(", ")
              : "Taşıma Çantası, Kullanım Kılavuzu, Garanti Belgesi",
        },
      ],
    },
    {
      id: "garanti",
      title: "Garanti & Destek",
      icon: Shield,
      iconBg: "bg-slate-100 text-slate-700",
      rows: [
        {
          key: "warranty_detail",
          label: "Garanti Kapsamı",
          getValue: (_p: any) => "24 Ay Resmi Distribütör Garantili",
        },
        {
          key: "service_support",
          label: "Servis Desteği",
          getValue: (_p: any) => "Türkiye Geneli Yetkili Servis Ağı",
        },
      ],
    },
    {
      id: "yorumlar",
      title: "Kullanıcı Değerlendirmeleri",
      icon: Star,
      iconBg: "bg-slate-100 text-slate-700",
      rows: [
        {
          key: "rating",
          label: "Müşteri Puanı",
          getValue: (p: any) => p.rating || "4.8",
          isRatingBadge: true,
        },
        {
          key: "review_count",
          label: "Toplam Yorum",
          getValue: (p: any) => `${p.reviews_count || 32} Değerlendirme`,
        },
      ],
    },
  ]

  const isRowDifferent = (row: any) => {
    if (productsToRender.length < 2) return false
    const vals = productsToRender.map((p) => String(row.getValue(p)).trim().toLowerCase())
    return !vals.every((val) => val === vals[0])
  }

  return (
    <div className="bg-[#f6f7f8] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* ── TOP HEADER CARD ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-[#C98484] font-black text-xs uppercase tracking-wider mb-1">
              <ArrowLeftRight className="w-4 h-4" />
              <span>ÜRÜN KARŞILAŞTIRMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Seçilen Ürünleri Karşılaştırın
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Ürünlerin teknik özelliklerini, fiyatlarını ve stok durumlarını yan yana inceleyin.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {productsToRender.length >= 2 && (
              <button
                type="button"
                onClick={() => setOnlyDifferences(!onlyDifferences)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-2xs border ${
                  onlyDifferences
                    ? "bg-[#C98484] text-white border-[#C98484]"
                    : "bg-[#FFF7ED] border-[#FFEDD5] text-[#C98484] hover:bg-rose-100"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{onlyDifferences ? "Tüm Özellikleri Gör" : "Farklılıkları Gör"}</span>
              </button>
            )}

            <Link
              href="/magaza"
              className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-5 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" /> Mağazaya Dön
            </Link>

            {productsToRender.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#FEE2E2] bg-[#FEF2F2] px-5 py-2.5 text-xs font-extrabold text-[#EF4444] hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Tümünü Temizle
              </button>
            )}
          </div>
        </div>

        {/* ── EMPTY STATE ── */}
        {productsToRender.length === 0 && !loading ? (
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-12 text-center shadow-2xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#C98484] grid place-items-center mx-auto">
              <ArrowLeftRight className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Karşılaştırma Listeniz Henüz Boş</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Ürün detay veya liste sayfalarındaki <strong className="text-slate-800">"Karşılaştır"</strong> butonuna tıklayarak ürünleri buraya ekleyip karşılaştırabilirsiniz.
            </p>
            <Link
              href="/magaza"
              className="inline-flex items-center gap-2 rounded-full bg-[#C98484] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-rose-600 transition-all"
            >
              <ShoppingCart className="w-4 h-4" /> Ürünleri İnceleyin
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── TOP SECTION: LEFT SIDEBAR + PRODUCT CARDS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Summary Card: "KARŞILAŞTIRMA" (3 cols on desktop) */}
              <div className="lg:col-span-3 bg-white rounded-[24px] border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-4">
                    KARŞILAŞTIRMA
                  </span>

                  <div className="space-y-3.5">
                    {/* Item 1 */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#C98484] flex items-center justify-center shrink-0">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          {productsToRender.length} Ürün
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                          Karşılaştırılıyor
                        </p>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                        <ListFilter className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          {specSections.length} Özellik Grubu
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                          Detaylı İnceleme
                        </p>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#C98484] flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          Farkları Göster
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                          Öne çıkan farklar vurgulanır
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Product Cards Grid (9 cols on desktop) */}
              <div className={`lg:col-span-9 grid ${productCardsGridClass} gap-5 w-full items-stretch`}>
                {productsToRender.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-2xs flex gap-4 relative group h-full"
                  >
                    {/* Left Product Image */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 bg-slate-50 rounded-2xl overflow-hidden p-2 flex items-center justify-center border border-slate-100">
                      <Image
                        src={product.thumbnail || "/brand/zkhome-logo.svg"}
                        alt={product.title}
                        fill
                        unoptimized
                        className="object-contain p-1"
                      />
                    </div>

                    {/* Right Product Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-center justify-between">
                        {product.brand ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase text-[#C98484] border border-rose-100">
                            <Shield className="w-3 h-3" /> {product.brand}
                          </span>
                        ) : <span />}

                        <button
                          type="button"
                          onClick={() => handleRemove(product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <Link
                        href={`/urunler/${product.handle}`}
                        className="font-extrabold text-slate-900 hover:text-[#C98484] text-xs line-clamp-2 leading-snug my-1"
                      >
                        {product.title}
                      </Link>

                      <div className="text-xl font-black text-[#C98484] tracking-tight">
                        {typeof product.price === "number"
                          ? formatComparePrice(product.price)
                          : product.formatted_price || product.price || "—"}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] my-1 flex-wrap">
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <Star className="w-3.5 h-3.5 fill-[#C98484] stroke-[#C98484]" />
                          <span>{product.rating || "4.8"}</span>
                        </div>

                        <span className="text-slate-300">|</span>

                        <span className="inline-flex items-center gap-1 text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full font-extrabold text-[10px]">
                          <Check className="w-3 h-3 text-[#059669]" /> Stokta Var
                        </span>
                      </div>

                      <Link
                        href={`/urunler/${product.handle}`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-[#C98484] text-white font-extrabold text-xs shadow-xs hover:bg-rose-600 transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Sepete Ekle
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── BOTTOM SECTION: GROUPED SPECS TABLE MATCHING IMAGE 3 (DARK GRAY/BLACK TEXT COLORS) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Vertical Navigation Tabs (3 cols) */}
              <div className="lg:col-span-3 bg-white rounded-[24px] border border-slate-200/80 p-3 shadow-2xs space-y-1.5 sticky top-24">
                {specSections.map((sec) => {
                  const IconComp = sec.icon
                  const isActive = activeNavGroup === sec.id
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setActiveNavGroup(sec.id)
                        setOpenAccordions((prev) => ({ ...prev, [sec.id]: true }))
                        const el = document.getElementById(`sec-${sec.id}`)
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
                      }}
                      className={`flex items-center gap-3 w-full p-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#C98484] text-white shadow-xs"
                          : "bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? "bg-white/20 text-white" : sec.iconBg
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span>{sec.title}</span>
                    </button>
                  )
                })}
              </div>

              {/* Right Clean Specs Table (9 cols) */}
              <div className="lg:col-span-9 bg-white rounded-[24px] border border-slate-200/80 shadow-2xs overflow-hidden divide-y divide-slate-100/60">
                {specSections.map((sec) => {
                  const IconComp = sec.icon
                  const isOpen = openAccordions[sec.id] !== false
                  const rowsToDisplay = onlyDifferences
                    ? sec.rows.filter((r) => isRowDifferent(r))
                    : sec.rows

                  if (onlyDifferences && rowsToDisplay.length === 0) return null

                  return (
                    <div key={sec.id} id={`sec-${sec.id}`} className="transition-all">
                      {/* Section Header Bar */}
                      <button
                        type="button"
                        onClick={() => toggleAccordion(sec.id)}
                        className="flex items-center justify-between w-full p-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                          <IconComp className="w-4 h-4 text-[#C98484]" />
                          <span>{sec.title}</span>
                          <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200/80">
                            {rowsToDisplay.length} Özellik
                          </span>
                        </div>

                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {/* Table Rows matching Image 3 (Dark Gray/Black text, ONLY Price is Orange) */}
                      {isOpen && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                            <tbody className="divide-y divide-slate-100/60">
                              {rowsToDisplay.map((row) => {
                                const isDifferent = isRowDifferent(row)
                                return (
                                  <tr
                                    key={row.key}
                                    className={`transition-colors ${
                                      isDifferent ? "bg-[#FFF7ED]/60" : "bg-white hover:bg-slate-50/40"
                                    }`}
                                  >
                                    {/* Label */}
                                    <td className="py-3.5 px-6 font-extrabold text-slate-900 w-[220px]">
                                      <div className="flex items-center justify-between gap-2">
                                        <span>{row.label}</span>
                                        {isDifferent && (
                                          <span className="text-[10px] font-black uppercase text-[#C98484] bg-rose-100/80 px-1.5 py-0.5 rounded-md border border-rose-200/60">
                                            FARKLI
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Product Values: Always Dark Gray/Black (matching Image 3), NEVER Orange! */}
                                    {productsToRender.map((p) => {
                                      const val = row.getValue(p)
                                      return (
                                        <td
                                          key={p.id}
                                          className="py-3.5 px-6 font-semibold text-slate-800"
                                        >
                                          {row.isStockBadge ? (
                                            <span className="inline-flex items-center gap-1 text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full font-extrabold text-[11px]">
                                              <Check className="w-3 h-3 text-[#059669]" /> Stokta Var
                                            </span>
                                          ) : row.isRatingBadge ? (
                                            <div className="flex items-center gap-1 text-[#C98484] font-bold">
                                              <Star className="w-3.5 h-3.5 fill-[#C98484] stroke-[#C98484]" />
                                              <span>{val}</span>
                                            </div>
                                          ) : row.isPrice ? (
                                            <span className="text-[#C98484] font-black text-sm">
                                              {val}
                                            </span>
                                          ) : (
                                            <span className="text-slate-800 font-semibold">{val}</span>
                                          )}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
