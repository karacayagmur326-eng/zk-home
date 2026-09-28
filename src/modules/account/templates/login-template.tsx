"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import { SellerQuestionButton } from "@components/common/SellerQuestion"
import { ShieldCheck, Zap, Package, Headphones, ArrowRight, Truck, RefreshCw, Award, Lock } from "@lib/icons"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 text-slate-900 font-sans">
      {/* Main 2-Column Card Container */}
      <div className="w-full rounded-none sm:rounded-3xl border-x-0 sm:border border-y border-slate-200/80 sm:border-slate-100 bg-white shadow-none sm:shadow-soft overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">

        {/* Desktop Left Column: Brand Promo & Features (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-4 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 xl:p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Subtle Orange Glow Backdrop */}
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#C98484]/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />

          {/* Top Section */}
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C98484]/40 bg-[#C98484]/15 px-3 py-1 text-[11px] font-bold text-[#C98484] backdrop-blur-xs">
              <Zap className="h-3.5 w-3.5 fill-[#C98484]" />
              <span>ZK Home Üye Paneli</span>
            </div>

            <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
              Ayrıcalıklı Alışveriş Deneyimine Hoş Geldiniz
            </h2>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              ZK Home hesabınızla siparişlerinizi, favorilerinizi ve adreslerinizi tek yerden yönetin.
            </p>
          </div>

          {/* Middle Features List */}
          <div className="relative z-10 my-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#C98484] backdrop-blur-xs">
                <Truck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Hızlı & Güvenli Teslimat</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-snug">
                  2.500 TL üzeri tüm siparişlerde ücretsiz kargo avantajı.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#C98484] backdrop-blur-xs">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Ürün Bilgileri</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-snug">
                  Garanti ve servis koşulları ürün sayfasında açıkça belirtilir.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#C98484] backdrop-blur-xs">
                <RefreshCw className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">14 Gün Kolay İade</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-snug">
                  Memnun kalmadığınız ürünlerde koşulsuz iade güvencesi.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock className="h-3.5 w-3.5 text-[#C98484]" />
              256-bit SSL Güvenli Bağlantı
            </span>
            <span className="text-emerald-400 font-bold">100% Orijinal Ürün</span>
          </div>
        </div>

        {/* Form Area - Full Width on Mobile, Right 8-Cols on Desktop */}
        <div className="relative w-full lg:col-span-8 p-4 pt-14 sm:p-10 lg:p-12 flex flex-col justify-center">
          <Link
            href="/"
            aria-label="Giriş ve üyelik ekranını kapat"
            title="Kapat"
            className="absolute right-4 top-3 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#C98484] hover:text-[#a45d5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484] sm:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Link>
          {/* Top Segmented Tab Switcher */}
          <div className="flex items-center justify-around border-b border-slate-100 mb-6">
            <button
              type="button"
              onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
              className={`w-1/2 text-center pb-3 text-sm sm:text-base font-bold transition-all cursor-pointer ${
                currentView === LOGIN_VIEW.SIGN_IN
                  ? "border-b-2 border-[#C98484] text-[#C98484]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Giriş Yap
            </button>

            <button
              type="button"
              onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
              className={`w-1/2 text-center pb-3 text-sm sm:text-base font-bold transition-all cursor-pointer ${
                currentView === LOGIN_VIEW.REGISTER
                  ? "border-b-2 border-[#C98484] text-[#C98484]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Üye Ol
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 flex items-center justify-center w-full">
            {currentView === LOGIN_VIEW.SIGN_IN ? (
              <Login setCurrentView={setCurrentView} />
            ) : (
              <Register setCurrentView={setCurrentView} />
            )}
          </div>
        </div>
      </div>

      {/* SINGLE Bottom Support Banner: "Sorunuz mu var?" */}
      <div className="relative overflow-hidden rounded-none sm:rounded-3xl border-x-0 sm:border border-y border-slate-200/80 sm:border-slate-100 bg-white p-4 sm:p-6 shadow-none sm:shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-50/50 blur-2xl" />

        <div className="flex items-center gap-4 z-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50/90 text-[#C98484] border border-rose-100/60 shadow-2xs">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Sorunuz mu var?
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-lg">
              Üyelik, sipariş veya ürünlerimizle ilgili sorunuzu doğrudan satıcıya iletin.
            </p>
          </div>
        </div>

        <SellerQuestionButton
          className="z-10 shrink-0 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#C98484] hover:bg-rose-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <span>Satıcıya Sor</span>
          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
        </SellerQuestionButton>
      </div>
    </div>
  )
}

export default LoginTemplate
