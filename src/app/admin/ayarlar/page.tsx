"use client"

import React, { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ThemeSettingsComponent from "../tema-ayarlari/page"
import IntegrationsComponent from "../entegrasyonlar/page"
import MagazaAyarlariComponent from "../magaza-ayarlari/page"
import {
  Palette,
  PlugZap,
  Store,
  Globe,
  Phone,
  Settings,
  Sparkles,
  Layers,
  FileCode,
  Truck,
  ShieldCheck,
  CreditCard,
  ReceiptText,
} from "lucide-react"

type MainTab = "tema" | "entegrasyonlar" | "magaza" | "seo" | "iletisim"

function AyarlarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab") as MainTab | null
  const [activeMainTab, setActiveMainTab] = useState<MainTab>(
    tabParam && ["tema", "entegrasyonlar", "magaza", "seo", "iletisim"].includes(tabParam)
      ? tabParam
      : "tema"
  )

  useEffect(() => {
    if (tabParam && ["tema", "entegrasyonlar", "magaza", "seo", "iletisim"].includes(tabParam)) {
      setActiveMainTab(tabParam)
    }
  }, [tabParam])

  function handleTabChange(tab: MainTab) {
    setActiveMainTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", tab)
    window.history.replaceState(window.history.state, "", url.toString())
  }

  const TABS = [
    {
      id: "tema" as MainTab,
      label: "Tema & Tasarım",
      desc: "Logolar, renkler, tipografi, menü ve görünüm ayarları",
      icon: Palette,
      badge: "Görünüm",
    },
    {
      id: "entegrasyonlar" as MainTab,
      label: "Entegrasyonlar",
      desc: "İyzico Sanal POS & BirFatura E-Fatura bağlantıları",
      icon: PlugZap,
      badge: "Ödeme & Fatura",
    },
    {
      id: "magaza" as MainTab,
      label: "Mağaza & Kargo",
      desc: "Teslimat yöntemleri, vergi/KDV, havale ve sipariş kuralları",
      icon: Store,
      badge: "Ticaret",
    },
    {
      id: "seo" as MainTab,
      label: "Google & SEO Kodları",
      desc: "GA4, GTM, Search Console ve özel scriptler",
      icon: Globe,
      badge: "Analytics",
    },
    {
      id: "iletisim" as MainTab,
      label: "Firma & İletişim",
      desc: "Firma unvanı, adres, telefon, e-posta ve sosyal medya",
      icon: Phone,
      badge: "Kurumsal",
    },
  ]

  return (
    <div className="w-full space-y-6 pb-20 font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-[#C98484] border border-rose-200/60 shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Sistem & Mağaza Ayarları
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1.5 pl-10">
            Tüm mağaza yapılandırması, entegrasyonlar, tema tasarımı ve SEO kodlarınızı tek merkezden yönetin.
          </p>
        </div>
      </div>

      {/* TOP MASTER TABS NAVIGATION */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeMainTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isActive
                  ? "bg-rose-50/60 border-[#C98484] shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20"
                  : "bg-white border-slate-200/80 hover:border-rose-200 hover:bg-slate-50/50 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`p-2.5 rounded-xl ${
                    isActive
                      ? "bg-[#C98484] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-rose-200/80 text-rose-900"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <div>
                <h4
                  className={`text-xs font-black ${
                    isActive ? "text-rose-950" : "text-slate-800"
                  }`}
                >
                  {tab.label}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                  {tab.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div className="pt-2">
        {activeMainTab === "tema" && (
          <div>
            <ThemeSettingsComponent mode="theme" initialTab="logos" />
          </div>
        )}

        {activeMainTab === "entegrasyonlar" && (
          <div>
            <IntegrationsComponent />
          </div>
        )}

        {activeMainTab === "magaza" && (
          <div>
            <MagazaAyarlariComponent />
          </div>
        )}

        {activeMainTab === "seo" && (
          <div>
            <ThemeSettingsComponent mode="seo" initialTab="seo" />
          </div>
        )}

        {activeMainTab === "iletisim" && (
          <div>
            <ThemeSettingsComponent mode="contact" initialTab="footer" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AyarlarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Ayarlar yükleniyor...</div>}>
      <AyarlarContent />
    </Suspense>
  )
}
