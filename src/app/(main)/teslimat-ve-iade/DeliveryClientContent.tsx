"use client"

import { useState } from "react"
import Link from "next/link"
import { Truck, Package, ShieldCheck, RotateCcw, Headphones, ArrowRight, ChevronDown } from "lucide-react"
import { AppIcon } from "@lib/icons"

export interface DeliveryInfoProps {
  info: Record<string, any>
}

interface SectionItem {
  id: string
  title: string
  iconName?: string
  iconImgSrc?: string
  hasIcon: boolean
  htmlContent: string
}

function parseAccordionSections(htmlStr: string): SectionItem[] {
  if (!htmlStr || !htmlStr.includes("<h3")) {
    return []
  }

  const sections: SectionItem[] = []
  
  // Split by <h3> tag boundaries: match preceding block, inner title, and body
  const h3Regex = /(.*?)(?:<h3[^>]*>([\s\S]*?)<\/h3>)([\s\S]*?)(?=(?:<h3[^>]*>|$))/gi

  const EMOJI_TO_ICON: Record<string, string> = {
    "🏪": "store",
    "🏬": "store",
    "🚚": "truck",
    "📦": "package-check",
    "⚠️": "alert-triangle",
    "🛡️": "shield-check",
    "🔄": "rotate-ccw",
    "↩️": "corner-up-left",
    "📄": "file-text",
    "📍": "map-pin",
    "⏱️": "clock",
    "⚡": "zap",
    "🔋": "battery",
    "🔨": "hammer",
    "🔧": "wrench",
    "🎧": "headphones",
    "💳": "credit-card",
    "🔒": "lock",
    "🪙": "coins",
    "🧾": "receipt",
    "⭐": "star",
    "🏷️": "tag",
  }

  let match
  let index = 0
  while ((match = h3Regex.exec(htmlStr)) !== null) {
    index++
    const prefixBlock = match[1] || "" // content before this <h3>
    const rawTitle = match[2] || ""     // content inside <h3>...</h3>
    const htmlContent = match[3] || ""  // content after </h3>

    let iconName = ""
    let iconImgSrc = ""

    // Combined search string (prefix + title) to catch icon tags placed either inside or right before <h3>
    const combinedHeaderSearch = prefixBlock.slice(-250) + " " + rawTitle

    // 1. Extract data-icon="name" attribute
    const dataIconMatch = combinedHeaderSearch.match(/data-icon=["']([^"']+)["']/i)
    if (dataIconMatch) {
      iconName = dataIconMatch[1]
    }

    // 2. Extract <img> tag src if present
    const imgMatch = combinedHeaderSearch.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
    if (imgMatch) {
      iconImgSrc = imgMatch[1]
    }

    // 3. Emoji fallback
    if (!iconName) {
      const cleanTextNoHtml = combinedHeaderSearch.replace(/<[^>]*>/g, "").trim()
      for (const [emojiChar, mappedIcon] of Object.entries(EMOJI_TO_ICON)) {
        if (cleanTextNoHtml.includes(emojiChar)) {
          iconName = mappedIcon
          break
        }
      }
    }

    // Clean title from all tags, icon names, emojis
    let cleanTitle = rawTitle
      .replace(/<span[^>]*data-icon=["'][^"']+["'][^>]*>[\s\S]*?<\/span>/gi, "")
      .replace(/<i[^>]*data-icon=["'][^"']+["'][^>]*>[\s\S]*?<\/i>/gi, "")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/İkon:[^]*?(&nbsp;|\s|$)/gi, "")
      .replace(/(&nbsp;|\s)+/g, " ")
      .replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEF6])/gu, "")
      .trim()

    const hasIcon = Boolean(iconName || iconImgSrc)

    sections.push({
      id: `acc_${index}`,
      title: cleanTitle || "Başlıksız",
      iconName: iconName || "",
      iconImgSrc: iconImgSrc || "",
      hasIcon: hasIcon,
      htmlContent,
    })
  }

  return sections
}

const fallbackSections: SectionItem[] = [
  {
    id: "acc_1",
    title: "Siparişlerin Hazırlanması",
    iconName: "package-check",
    hasIcon: true,
    htmlContent: '<p>Siparişler, ödeme onayının alınmasının ardından stok ve ürün kontrolleri yapılarak hazırlanmaya başlanır. Stokta bulunan ürünler, aksi belirtilmedikçe <strong class="text-[#C98484] font-bold">1-3 iş günü</strong> içerisinde kargo firmasına teslim edilir.</p>'
  },
  {
    id: "acc_2",
    title: "Teslimat",
    iconName: "truck",
    hasIcon: true,
    htmlContent: '<p>Siparişler, müşterinin sipariş sırasında bildirdiği teslimat adresine gönderilir. Teslimat süresi; teslimat adresine, kargo firmasının operasyonlarına ve bölgesel koşullara göre değişebilir.</p>'
  },
  {
    id: "acc_3",
    title: "Hasarlı Paketler",
    iconName: "shield-check",
    hasIcon: true,
    htmlContent: '<p>Teslimat sırasında pakette yırtılma, ezilme, açılma, ıslanma veya benzeri bir hasar görülmesi halinde ürün kontrol edilmeli ve gerektiğinde kargo görevlisine hasar tespit tutanağı düzenletilmelidir.</p>'
  },
  {
    id: "acc_4",
    title: "Sipariş İptali",
    iconName: "box",
    hasIcon: true,
    htmlContent: '<p>Henüz kargoya verilmemiş siparişler için müşteri hizmetleri üzerinden iptal talebi oluşturulabilir. Kargoya teslim edilmiş siparişlerde teslimat ve iade prosedürü uygulanır.</p>'
  },
  {
    id: "acc_5",
    title: "İade Koşulları",
    iconName: "refresh-cw",
    hasIcon: true,
    htmlContent: '<p>Ürünlerin iade edilebilmesi için kullanılmamış, orijinal ambalajında, tüm aksesuarları ve belgeleri ile birlikte gönderilmesi gerekmektedir.</p>'
  },
  {
    id: "acc_6",
    title: "Cayma Hakkı",
    iconName: "file-text",
    hasIcon: true,
    htmlContent: '<p>Tüketici, ürünü teslim aldığı tarihten itibaren <strong class="text-[#C98484] font-bold">14 gün</strong> içerisinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir.</p>'
  },
  {
    id: "acc_7",
    title: "İade Adresi",
    iconName: "map-pin",
    hasIcon: true,
    htmlContent: '<p>İade adresi ve kargo bilgileri mağaza açılmadan önce yapılandırılacaktır.</p>'
  }
]

export default function DeliveryClientContent({ info }: DeliveryInfoProps) {
  const parsed = parseAccordionSections(info.content_html || "")
  const sections = parsed.length > 0 ? parsed : fallbackSections

  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    sections.forEach((sec) => {
      initial[sec.id] = true
    })
    return initial
  })

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
      
      {/* SOL SÜTUN (2/3): TEK ZEMİN (Tek Beyaz Kart İçinde Bölücülü Akordeon Listesi) */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {sections.map((sec) => {
            const isOpen = openItems[sec.id] !== false

            return (
              <div key={sec.id} className="transition-all">
                <button
                  type="button"
                  onClick={() => toggleItem(sec.id)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors cursor-pointer group gap-4"
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    {sec.hasIcon && (
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                        {sec.iconImgSrc ? (
                          <img src={sec.iconImgSrc} alt="" className="w-5 h-5 object-contain" />
                        ) : (
                          <AppIcon name={sec.iconName} className="w-5 h-5" />
                        )}
                      </div>
                    )}
                    <h3 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
                      {sec.title}
                    </h3>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#C98484]" : ""}`} />
                </button>
                
                {isOpen && (
                  <div 
                    className="px-5 sm:px-6 pb-6 pt-0 text-[0.8rem] text-slate-600 leading-relaxed font-normal [&>p]:mt-2 [&>p]:leading-relaxed [&>p]:text-[0.8rem] [&>p>strong]:text-[#C98484] [&>p>strong]:font-bold [&>p>span]:text-[#C98484] [&>p>span]:font-bold"
                    dangerouslySetInnerHTML={{ __html: sec.htmlContent }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* SAĞ SÜTUN (1/3): Öne Çıkan Bilgiler & İade Süreci */}
      <div className="space-y-6">

        {/* Sağ Kart 1: Öne Çıkan Bilgiler */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight border-b border-slate-100 pb-3.5">
            {info.highlight_title || "Öne Çıkan Bilgiler"}
          </h3>

          <div className="space-y-4 text-[0.8rem]">
            
            {/* 1. Kargo */}
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.h1_title || "1-3 İş Günü İçinde Kargoya Teslim"}</span>
                <span className="text-slate-600 font-normal block">{info.h1_desc || "Stokta olan ürünler için geçerlidir."}</span>
              </div>
            </div>

            {/* 2. Ücretsiz Kargo */}
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.h2_title || "Ücretsiz Kargo"}</span>
                <span className="text-slate-600 font-normal block">{info.h2_desc || "Tüm siparişlerinizde ücretsiz kargo."}</span>
              </div>
            </div>

            {/* 3. 14 Gün İade */}
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.h3_title || "14 Gün İçinde İade"}</span>
                <span className="text-slate-600 font-normal block">{info.h3_desc || "Koşulsuz iade hakkınız bulunmaktadır."}</span>
              </div>
            </div>

            {/* 4. Garanti */}
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.h4_title || "2 Yıl Garanti"}</span>
                <span className="text-slate-600 font-normal block">{info.h4_desc || "Tüm ürünlerimizde geçerlidir."}</span>
              </div>
            </div>

            {/* 5. Destek */}
            <div className="flex items-start gap-3">
              <Headphones className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.h5_title || "7/24 Destek"}</span>
                <span className="text-slate-600 font-normal block">{info.h5_desc || "Her zaman yanınızdayız."}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Sağ Kart 2: İade Süreci Nasıl İşler? */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight border-b border-slate-100 pb-3.5">
            {info.process_title || "İade Süreci Nasıl İşler?"}
          </h3>

          <div className="space-y-4 text-[0.8rem]">
            
            {/* Adım 1 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border border-rose-400 text-[#C98484] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.step1_title || "İade talebinizi oluşturun."}</span>
                <span className="text-slate-600 font-normal leading-relaxed block">{info.step1_desc || "Hesabınızdan veya müşteri hizmetlerimiz aracılığıyla iade talebinizi bildirin."}</span>
              </div>
            </div>

            {/* Adım 2 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border border-rose-400 text-[#C98484] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.step2_title || "Ürünü paketleyin."}</span>
                <span className="text-slate-600 font-normal leading-relaxed block">{info.step2_desc || "Ürünü orijinal ambalajı ve tüm aksesuarları ile birlikte paketleyin."}</span>
              </div>
            </div>

            {/* Adım 3 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border border-rose-400 text-[#C98484] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.step3_title || "Kargoya teslim edin."}</span>
                <span className="text-slate-600 font-normal leading-relaxed block">{info.step3_desc || "Anlaşmalı kargomuz ile ücretsiz olarak ürünü tarafımıza gönderin."}</span>
              </div>
            </div>

            {/* Adım 4 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border border-rose-400 text-[#C98484] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </div>
              <div>
                <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">{info.step4_title || "İade onayı ve ücret iadesi."}</span>
                <span className="text-slate-600 font-normal leading-relaxed block">{info.step4_desc || "Ürün kontrolü sonrası iadeniz onaylanır ve ücret iadeniz yapılır."}</span>
              </div>
            </div>

          </div>

          {/* Alt Buton: İade Talebi Oluştur */}
          <div className="pt-2">
            <Link
              href={info.process_btn_href || "/hesabim/siparislerim"}
              className="w-full inline-flex items-center justify-between px-5 py-3 border border-slate-200 hover:border-rose-300 text-slate-800 hover:text-[#C98484] bg-slate-50/80 hover:bg-rose-50/40 rounded-xl text-[0.8rem] font-bold transition-all duration-300 group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#C98484]" />
                <span>{info.process_btn_text || "İade Talebi Oluştur"}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C98484] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  )
}
