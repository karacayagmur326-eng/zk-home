"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { usePathname } from "next/navigation"
import { browserAnalyticsAllowed } from "@lib/analytics/traffic-policy"
import { ChevronDown, ChevronUp, X, Check, Cookie } from "lucide-react"

export type CookieCategoryPreferences = {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const DEFAULT_PREFERENCES: CookieCategoryPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
}

export default function CookieConsent({ ga4Id, gtmId }: { ga4Id?: string; gtmId?: string }) {
  const pathname = usePathname()
  const [trackingEnabled, setTrackingEnabled] = useState(false)
  useEffect(() => {
    setTrackingEnabled(browserAnalyticsAllowed())
    if (ga4Id) {
      // GA checks this flag before sending, including automatic history events.
      Object.defineProperty(window, `ga-disable-${ga4Id}`, { configurable: true, get: () => !browserAnalyticsAllowed() })
    }
  }, [pathname, ga4Id])
  const [consentSaved, setConsentSaved] = useState<boolean | null>(null)
  const [preferences, setPreferences] = useState<CookieCategoryPreferences>(DEFAULT_PREFERENCES)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const CONSENT_VALIDITY_MS = 180 * 24 * 60 * 60 * 1000 // 180 Gün (6 Ay) KVKK & GDPR yasal onay süresi

  useEffect(() => {
    try {
      const saved = localStorage.getItem("zkhome_cookie_consent_v2")
      if (saved) {
        const parsed = JSON.parse(saved)
        const timestamp = parsed.timestamp || 0
        const isExpired = Date.now() - timestamp > CONSENT_VALIDITY_MS
        if (!isExpired) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed, essential: true })
          setConsentSaved(true)
          setBannerOpen(false)
        } else {
          setConsentSaved(false)
          setBannerOpen(true)
        }
      } else {
        setConsentSaved(false)
        setBannerOpen(true)
      }
    } catch {
      setConsentSaved(false)
      setBannerOpen(true)
    }
  }, [])

  const savePreferences = (newPrefs: CookieCategoryPreferences) => {
    const finalPrefs = { ...newPrefs, essential: true, timestamp: Date.now() }
    try {
      localStorage.setItem("zkhome_cookie_consent_v2", JSON.stringify(finalPrefs))
    } catch (e) {
      console.error(e)
    }
    setPreferences(finalPrefs)
    setConsentSaved(true)
    setBannerOpen(false)
    setModalOpen(false)
  }

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    })
  }

  const rejectAll = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    })
  }

  const toggleCategory = (key: keyof CookieCategoryPreferences) => {
    if (key === "essential") return
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleExpand = (catId: string) => {
    setExpandedCategory((prev) => (prev === catId ? null : catId))
  }

  return (
    <>
      {/* GA4 Script Integration */}
      {trackingEnabled && preferences.analytics && ga4Id && (
        <>
          <Script
            id="zkhome-ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
            onLoad={() => window.dispatchEvent(new Event("zk-analytics-ready"))}
          />
          <Script id="zkhome-ga4-consent" strategy="afterInteractive" onReady={() => { window.dispatchEvent(new Event("zk-analytics-ready")) }}>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}



      {trackingEnabled && preferences.analytics && gtmId && <Script id="zkhome-gtm-consent" strategy="afterInteractive" onReady={() => { (window as any).__zkGtmReady = true; window.dispatchEvent(new Event("zk-analytics-ready")) }}>{`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');
      `}</Script>}

      {/* Bottom Right Floating Banner */}
      {bannerOpen && !modalOpen && (
        <div
          role="region"
          aria-label="Çerez Bildirimi"
          className="fixed bottom-4 right-4 z-[95] w-[calc(100%-2rem)] max-w-[420px] animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md">
            <h3 className="text-sm font-black text-slate-900">Çerez Kullanıyoruz</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Bu site, deneyiminizi kişiselleştirmek ve analiz yapmak amacıyla çerezler
              kullanmaktadır. Çerez ayarlarını istediğiniz zaman değiştirebilirsiniz.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={acceptAll}
                className="flex-1 rounded-xl bg-[#2B3445] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-900"
              >
                Hepsini Kabul Et
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="flex-1 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
              >
                Tümünü Reddet
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-xl bg-slate-200/80 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-300"
              >
                Kişiselleştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Modal Management Panel */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-black text-slate-900 sm:text-base">
                Çerez ve Tanımlama Teknolojileri Yönetim Paneli
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Çerez Kullanımını Yönet
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Web sitemiz, bazı çerezler aracılığıyla kullanıcı deneyimini geliştirmektedir.
                  Lütfen çerez tercihlerinizin ne olacağına karar verin.
                </p>
              </div>

              {/* Category Accordions */}
              <div className="space-y-3">
                {/* 1. Zorunlu Çerezler */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                  <div className="flex items-center justify-between p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand("essential")}
                      className="flex items-center gap-2.5 text-left text-xs font-bold text-slate-800 hover:text-slate-950 flex-1"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200/70 text-slate-600">
                        {expandedCategory === "essential" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span>Zorunlu Çerezler</span>
                    </button>
                    {/* Locked Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <span className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full bg-slate-300 p-0.5 opacity-80">
                        <span className="translate-x-5 grid h-5 w-5 place-items-center rounded-full bg-white text-slate-600 shadow-xs">
                          <Check className="h-3 w-3 text-slate-700" />
                        </span>
                      </span>
                    </div>
                  </div>

                  {expandedCategory === "essential" && (
                    <div className="border-t border-slate-200/80 bg-white p-4 text-xs text-slate-600">
                      <p className="mb-3 text-slate-600">
                        Bu çerezler, web sitesinin doğru şekilde çalışması için gereklidir. Devre dışı
                        bırakılamaz.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                              <th className="py-2 px-2.5">Ad</th>
                              <th className="py-2 px-2.5">Hizmet</th>
                              <th className="py-2 px-2.5">Açıklama</th>
                              <th className="py-2 px-2.5">Süre</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                Mağaza_Member_Data
                              </td>
                              <td className="py-2 px-2.5">Mağaza</td>
                              <td className="py-2 px-2.5">
                                Üyelik verilerinizin saklanması için kullanılan çerezler.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">
                                Oturum süresince
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                SERVERID
                              </td>
                              <td className="py-2 px-2.5">Mağaza</td>
                              <td className="py-2 px-2.5">
                                Sunucu oturum kimliği için kullanılan çerezler.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">
                                Oturum süresince
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                _zkhome_cart_id
                              </td>
                              <td className="py-2 px-2.5">Mağaza</td>
                              <td className="py-2 px-2.5">
                                Sepetin korunması, üyelik oturumunun sürdürülmesi, güvenli ödeme
                                işlemlerinin yapılması.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">
                                Oturum süresince
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                __cf_bm
                              </td>
                              <td className="py-2 px-2.5">Cloudflare</td>
                              <td className="py-2 px-2.5">
                                Güvenlik ve bot koruması etkileşim bilgileri saklanır.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">30 dakika</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Performans / Analitik Çerezler */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                  <div className="flex items-center justify-between p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand("analytics")}
                      className="flex items-center gap-2.5 text-left text-xs font-bold text-slate-800 hover:text-slate-950 flex-1"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200/70 text-slate-600">
                        {expandedCategory === "analytics" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span>Performans / Analitik Çerezler</span>
                    </button>
                    {/* Interactive Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCategory("analytics")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                        preferences.analytics ? "bg-[#5B6B7C]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full bg-white shadow-xs transition-transform ${
                          preferences.analytics ? "translate-x-5" : "translate-x-0"
                        }`}
                      >
                        {preferences.analytics ? (
                          <Check className="h-3 w-3 text-slate-700" />
                        ) : (
                          <X className="h-3 w-3 text-slate-400" />
                        )}
                      </span>
                    </button>
                  </div>

                  {expandedCategory === "analytics" && (
                    <div className="border-t border-slate-200/80 bg-white p-4 text-xs text-slate-600">
                      <p className="mb-3">
                        Bu çerezler, web sitemizin performansını ve analizini yapabilmemizi sağlar.
                        Siteyi daha iyi hale getirmemize yardımcı olur.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                              <th className="py-2 px-2.5">Ad</th>
                              <th className="py-2 px-2.5">Hizmet</th>
                              <th className="py-2 px-2.5">Açıklama</th>
                              <th className="py-2 px-2.5">Süre</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                Google Analytics
                              </td>
                              <td className="py-2 px-2.5">Google Analytics 4</td>
                              <td className="py-2 px-2.5">
                                Ziyaretçilerin internet sitesini nasıl kullandığını anlamak,
                                ziyaret ve trafik istatistiklerini ölçmek, sayfa performansını analiz
                                etmek ve kullanıcı deneyimini geliştirmek amacıyla kullanılır.
                                Toplanan veriler istatistiksel analiz amacıyla değerlendirilir.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">2 yıl</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Reklam / Pazarlama Çerezleri */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                  <div className="flex items-center justify-between p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand("marketing")}
                      className="flex items-center gap-2.5 text-left text-xs font-bold text-slate-800 hover:text-slate-950 flex-1"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200/70 text-slate-600">
                        {expandedCategory === "marketing" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span>Reklam / Pazarlama Çerezleri</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCategory("marketing")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                        preferences.marketing ? "bg-[#5B6B7C]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full bg-white shadow-xs transition-transform ${
                          preferences.marketing ? "translate-x-5" : "translate-x-0"
                        }`}
                      >
                        {preferences.marketing ? (
                          <Check className="h-3 w-3 text-slate-700" />
                        ) : (
                          <X className="h-3 w-3 text-slate-400" />
                        )}
                      </span>
                    </button>
                  </div>

                  {expandedCategory === "marketing" && (
                    <div className="border-t border-slate-200/80 bg-white p-4 text-xs text-slate-600">
                      <p className="mb-3">
                        Bu çerezler, reklamları ve pazarlama içeriklerini size özelleştirmenizi
                        sağlar. Sizi ilgilendiren içerik sunmayı amaçlar.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                              <th className="py-2 px-2.5">Ad</th>
                              <th className="py-2 px-2.5">Hizmet</th>
                              <th className="py-2 px-2.5">Açıklama</th>
                              <th className="py-2 px-2.5">Süre</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                Google Ads
                              </td>
                              <td className="py-2 px-2.5">Google Ads ve Remarketing</td>
                              <td className="py-2 px-2.5">
                                Reklam kampanyalarının performansını ölçmek, gerçekleştirilen satın
                                alma ve diğer dönüşümleri takip etmek, ziyaretçilere ilgi alanlarına
                                uygun reklamlar göstermek ve yeniden pazarlama çalışmaları yürütmek
                                amacıyla kullanılır.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">90 gün – 13 ay</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                Facebook Pixel
                              </td>
                              <td className="py-2 px-2.5">Meta / Facebook</td>
                              <td className="py-2 px-2.5">
                                İlgi alanlarınıza uygun reklamların gösterilmesi ve dönüşüm takibi
                                amacıyla saklanır.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">90 gün</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. İşlevsel Çerezler */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                  <div className="flex items-center justify-between p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand("functional")}
                      className="flex items-center gap-2.5 text-left text-xs font-bold text-slate-800 hover:text-slate-950 flex-1"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200/70 text-slate-600">
                        {expandedCategory === "functional" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span>İşlevsel Çerezler</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCategory("functional")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                        preferences.functional ? "bg-[#5B6B7C]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full bg-white shadow-xs transition-transform ${
                          preferences.functional ? "translate-x-5" : "translate-x-0"
                        }`}
                      >
                        {preferences.functional ? (
                          <Check className="h-3 w-3 text-slate-700" />
                        ) : (
                          <X className="h-3 w-3 text-slate-400" />
                        )}
                      </span>
                    </button>
                  </div>

                  {expandedCategory === "functional" && (
                    <div className="border-t border-slate-200/80 bg-white p-4 text-xs text-slate-600">
                      <p className="mb-3">
                        Bu çerezler, web sitesindeki gelişmiş işlevleri ve kişiselleştirilmiş
                        özellikleri iyileştirmemize yardımcı olur.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                              <th className="py-2 px-2.5">Ad</th>
                              <th className="py-2 px-2.5">Hizmet</th>
                              <th className="py-2 px-2.5">Açıklama</th>
                              <th className="py-2 px-2.5">Süre</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                Mağaza_SID
                              </td>
                              <td className="py-2 px-2.5">Mağaza</td>
                              <td className="py-2 px-2.5">
                                Kullanıcı oturum verisini saklayan çerez.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">
                                Oturum süresince
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                CultureSettings
                              </td>
                              <td className="py-2 px-2.5">Mağaza</td>
                              <td className="py-2 px-2.5">
                                Kültür ve dil ayarlarını hatırlamak için kullanılan çerez.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">
                                Oturum süresince
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                Mağaza_Cart_SessionID
                              </td>
                              <td className="py-2 px-2.5">Mağaza</td>
                              <td className="py-2 px-2.5">
                                Sepet oturum verilerinin saklanması için çerez.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">
                                Oturum süresince
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                __RequestVerificationToken
                              </td>
                              <td className="py-2 px-2.5">Mağaza</td>
                              <td className="py-2 px-2.5">
                                Güvenlik amacıyla doğrulama jetonunu içeren çerez.
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">
                                Oturum süresince
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 font-semibold text-slate-800">
                                MağazaReferer
                              </td>
                              <td className="py-2 px-2.5">Mağaza</td>
                              <td className="py-2 px-2.5">CookieRefererAciklama</td>
                              <td className="py-2 px-2.5 whitespace-nowrap">7 gün</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Action Buttons */}
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-xl bg-[#2D3748] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-900"
                >
                  Hepsini Kabul Et
                </button>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="rounded-xl bg-slate-200/80 px-5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-300"
                >
                  Tümünü Reddet
                </button>
              </div>
              <button
                type="button"
                onClick={() => savePreferences(preferences)}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-800 transition-all hover:bg-slate-200"
              >
                Mevcut Seçimi Kabul Et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
