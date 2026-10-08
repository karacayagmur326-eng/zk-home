"use client"

import React, { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import {
  User,
  MapPin,
  ShoppingBag,
  Heart,
  ChevronRight,
  Crown,
  Pencil,
  ShieldCheck,
  AppIcon,
  PackageCheck,
  MessageSquare,
} from "@lib/icons"
import type { MobileSettings } from "@lib/content/mobile-settings"
import {
  FAVORITES_STORAGE_KEY,
  FAVORITES_CHANGED_EVENT,
} from "@modules/products/components/product-card-actions"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
  mobileSettings?: MobileSettings
}

const Overview = ({ customer, orders, mobileSettings }: OverviewProps) => {
  const [favoriteCount, setFavoriteCount] = useState<number>(0)

  // Real Favorites Count from LocalStorage & Event Listener
  const updateFavoriteCount = () => {
    try {
      const saved = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
      const list = saved ? JSON.parse(saved) : []
      setFavoriteCount(Array.isArray(list) ? list.length : 0)
    } catch {
      setFavoriteCount(0)
    }
  }

  useEffect(() => {
    updateFavoriteCount()
    window.addEventListener(FAVORITES_CHANGED_EVENT, updateFavoriteCount)
    return () =>
      window.removeEventListener(FAVORITES_CHANGED_EVENT, updateFavoriteCount)
  }, [])

  // Real Profile Completion Percentage
  const profilePercent = getProfileCompletion(customer)
  const addressCount = customer?.addresses?.length || 0
  const orderCount = orders?.length || 0
  const userRole = (customer as any)?.role || ""
  const firstName = userRole === "Admin"
    ? "Admin"
    : customer?.first_name || customer?.email?.split("@")[0] || "Değerli Müşterimiz"
  const email = customer?.email || ""
  const showRolePanel = userRole === "Admin" || userRole === "Yönetici" || userRole === "Editör"
  const showMobileAdminPanel = userRole === "Admin" || userRole === "Yönetici"

  return (<>
    {mobileSettings?.enabled && <div className="-mx-4 min-h-screen bg-[#f5f6f7] pb-24 md:hidden">
      <section className="bg-white px-4 py-5"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-[#C98484] text-lg font-black text-slate-900">{userRole === "Admin" ? "A" : `${customer?.first_name?.[0] || customer?.email?.[0] || "S"}${customer?.last_name?.[0] || ""}`.toUpperCase()}</span><div><h1 className="text-lg font-black text-slate-950">{userRole === "Admin" ? "Admin" : customer?.first_name ? `${customer.first_name} ${customer.last_name || ""}` : mobileSettings.account.title}</h1><p className="text-[11px] text-slate-500">{customer?.email || mobileSettings.account.description}</p></div></div></section>
      {showMobileAdminPanel && (
        <LocalizedClientLink href="/admin" className="mx-3 mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#A95E5E]">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          <span>Yönetim panelini aç</span>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </LocalizedClientLink>
      )}
      <section className="m-3 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4"><PackageCheck className="h-6 w-6 text-[#C98484]" /><div><h2 className="text-xs font-black">{mobileSettings.account.noticeTitle}</h2><p className="mt-1 text-[10px] leading-relaxed text-slate-500">{mobileSettings.account.noticeDescription}</p></div></section>
      <div className="px-3 pb-2 pt-3"><h2 className="text-sm font-black">Hızlı İşlemler</h2></div><section className="grid grid-cols-2 gap-2.5 px-3">{mobileSettings.account.menuItems.filter((item) => item.active).map((item) => <LocalizedClientLink key={item.id} href={item.href} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] font-extrabold shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-[#C98484]"><AppIcon name={item.icon} className="h-5 w-5" /></span><span>{item.label}</span></LocalizedClientLink>)}</section>
      <LocalizedClientLink href="/hesabim/mesajlarim" className="m-3 flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 text-sm font-bold"><MessageSquare className="h-5 w-5 text-[#C98484]" /> Mesajlarım <ChevronRight className="ml-auto h-4 w-4 text-slate-400" /></LocalizedClientLink>
      <div className="m-3 mt-5 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-500">Profil tamamlanma</span><b className="text-[#C98484]">%{profilePercent}</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#C98484]" style={{ width: `${profilePercent}%` }} /></div></div>
    </div>}
    <div data-testid="overview-page-wrapper" className={`${mobileSettings?.enabled ? "hidden md:block" : "block"} space-y-6 text-slate-900 font-sans`}>
      <LocalizedClientLink href="/hesabim/mesajlarim" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#C98484] shadow-sm md:hidden"><MessageSquare className="h-5 w-5" /> Mesajlarım</LocalizedClientLink>
      {/* Top Welcome & User Login Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 leading-tight">
            Merhaba <span className="font-bold text-slate-900">{firstName}</span>
          </h1>

          {showRolePanel && (
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-[#C98484] text-white font-extrabold text-xs shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer ml-1"
            >
              {userRole === "Admin" ? (
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              ) : userRole === "Yönetici" ? (
                <Crown aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Pencil aria-hidden="true" className="h-4 w-4" />
              )}
              <span>
                {userRole === "Admin"
                  ? "Yönetim panelini aç"
                  : userRole === "Yönetici"
                  ? "Yönetici panelini aç"
                  : "Editör panelini aç"}
              </span>
              <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
            </a>
          )}
        </div>

        {email && (
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 border border-slate-100 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">
              <User className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <span className="block text-slate-400 font-medium text-[11px]">
                Giriş yapıldı:
              </span>
              <span className="font-bold text-slate-800">{email}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Profil (Profile Completion Ring) */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-soft hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Profil</h3>

          <div className="flex items-center justify-around my-2">
            {/* SVG Circular Progress Ring */}
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#C98484]"
                  strokeDasharray={`${profilePercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-base font-extrabold text-slate-900">
                {profilePercent}%
              </span>
            </div>

            <div className="text-left">
              <span className="block text-[11px] font-medium text-slate-500">
                Profiliniz
              </span>
              <span className="block text-sm font-extrabold text-[#C98484]">
                %{profilePercent}
              </span>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#C98484]">
                {profilePercent === 100 ? "TAMAMLANDI" : "TAMAMLANIYOR"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <LocalizedClientLink
              href="/hesabim/profil"
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all"
            >
              <span>{profilePercent === 100 ? "Profilimi Düzenle" : "Profilimi Tamamla"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </LocalizedClientLink>
          </div>
        </div>

        {/* Card 2: Adreslerim */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-soft hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Adreslerim</h3>

          <div className="flex items-center justify-center gap-3 my-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50/90 text-[#C98484]">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="block text-2xl font-black text-slate-900 leading-none">
                {addressCount}
              </span>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">
                KAYITLI
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <LocalizedClientLink
              href="/hesabim/adreslerim"
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all"
            >
              <span>Adreslerimi Yönet</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </LocalizedClientLink>
          </div>
        </div>

        {/* Card 3: Son Siparişlerim */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-soft hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Son Siparişlerim
          </h3>

          <div className="flex flex-col items-center justify-center my-1 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50/90 text-[#C98484] mb-2">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-slate-500">
              {orderCount > 0
                ? `${orderCount} adet siparişiniz bulunuyor.`
                : "Henüz sipariş bulunmuyor."}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <LocalizedClientLink
              href={orderCount > 0 ? "/hesabim/siparislerim" : "/magaza"}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all"
            >
              <span>
                {orderCount > 0 ? "Siparişlerimi Gör" : "Alışverişe Başla"}
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </LocalizedClientLink>
          </div>
        </div>

        {/* Card 4: Favorilerim */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-soft hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Favorilerim</h3>

          <div className="flex items-center justify-center gap-3 my-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50/90 text-[#C98484]">
              <Heart className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="block text-2xl font-black text-slate-900 leading-none">
                {favoriteCount}
              </span>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">
                ÜRÜN
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <LocalizedClientLink
              href="/hesabim/favorilerim"
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all"
            >
              <span>Favorilerimi Gör</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  </>)
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  if (!customer) return 0

  let filledCount = 0
  const totalFields = 5

  if (customer.email && customer.email.trim() !== "") filledCount++
  if (customer.first_name && customer.first_name.trim() !== "") filledCount++
  if (customer.last_name && customer.last_name.trim() !== "") filledCount++
  if (customer.phone && customer.phone.trim() !== "") filledCount++
  if (customer.addresses && customer.addresses.length > 0) filledCount++

  return Math.round((filledCount / totalFields) * 100)
}

export default Overview
