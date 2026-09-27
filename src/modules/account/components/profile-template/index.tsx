"use client"

import React, { useState } from "react"
import { useFormState as useActionState } from "react-dom"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { changeCustomerPassword, updateCustomerProfile } from "@lib/data/customer"
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle,
} from "@lib/icons"

export function getPasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      label: "",
      color: "gray",
      barColor: "bg-slate-200",
      textColor: "text-slate-400",
      isAcceptable: false,
    }
  }

  if (password.length < 6) {
    return {
      score: 1,
      label: "Şifre Çok Zayıf (Kabul Edilemez - En az 10 karakter gerekli)",
      color: "red",
      barColor: "bg-rose-500",
      textColor: "text-rose-600 font-bold",
      isAcceptable: false,
    }
  }

  let points = 0
  if (password.length >= 6) points++
  if (password.length >= 8) points++
  if (/[A-Z]/.test(password) || /[a-z]/.test(password)) points++
  if (/[0-9]/.test(password)) points++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) points++

  if (points <= 2) {
    return {
      score: 1,
      label: "Şifre Zayıf (Kabul Edilemez - Harf ve Rakam İçermeli)",
      color: "red",
      barColor: "bg-rose-500",
      textColor: "text-rose-600 font-bold",
      isAcceptable: false,
    }
  }

  if (points === 3) {
    return {
      score: 2,
      label: "Şifre Güvenliği: Orta (Kabul Edilebilir)",
      color: "orange",
      barColor: "bg-amber-500",
      textColor: "text-amber-600 font-bold",
      isAcceptable: true,
    }
  }

  return {
    score: 3,
    label: "Şifre Güvenliği: Güçlü",
    color: "green",
    barColor: "bg-emerald-500",
    textColor: "text-emerald-600 font-bold",
    isAcceptable: true,
  }
}

export function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null
  const strength = getPasswordStrength(password)

  return (
    <div className="space-y-2 mt-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className={strength.textColor}>
          {strength.label}
        </span>
        <span className="text-slate-400 font-medium text-[11px]">
          {password.length} Karakter
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 h-2 w-full">
        {/* Segment 1 */}
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength.score >= 1 ? strength.barColor : "bg-slate-200"
          }`}
        />
        {/* Segment 2 */}
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength.score >= 2 ? strength.barColor : "bg-slate-200"
          }`}
        />
        {/* Segment 3 */}
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength.score >= 3 ? strength.barColor : "bg-slate-200"
          }`}
        />
      </div>
    </div>
  )
}

type ProfileTemplateProps = {
  customer: HttpTypes.StoreCustomer
}

export default function ProfileTemplate({ customer }: ProfileTemplateProps) {
  const [newPassword, setNewPassword] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [profileState, profileFormAction, isProfilePending] = useActionState(updateCustomerProfile, {
    success: false,
    error: null,
  })

  const [formState, formAction, isPending] = useActionState(changeCustomerPassword, {
    success: false,
    error: null,
  })

  // Find default billing or first address
  const addresses = (customer.addresses || []) as any[]
  const billingAddress =
    addresses.find((a) => a.is_default_billing) ||
    addresses.find((a) => a.is_default_shipping) ||
    addresses[0] ||
    null

  const metadata = (billingAddress?.metadata || {}) as Record<string, any>

  const fullName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    "—"

  return (
    <div className="w-full space-y-6 text-slate-900 font-sans" data-testid="profile-page-wrapper">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Profil</h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Kişisel bilgilerinizi görüntüleyin ve güncelleyin. Bilgileriniz güvende.
        </p>
      </div>

      {/* Section 1: Kişisel Bilgiler Card (Editable Form with Required Fields) */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-soft space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
              <User className="h-5 w-5 stroke-[2.5]" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Kişisel Bilgiler
            </h2>
          </div>
        </div>

        <form action={profileFormAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ad <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="first_name"
                  required
                  defaultValue={customer.first_name || ""}
                  placeholder="Adınız"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Soyad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Soyad <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="last_name"
                  required
                  defaultValue={customer.last_name || ""}
                  placeholder="Soyadınız"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                E-posta <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={customer.email || ""}
                  placeholder="ornek@domain.com"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Telefon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  required
                  defaultValue={customer.phone || ""}
                  placeholder="5XX XXX XX XX"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {profileState?.error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">
              {profileState.error}
            </div>
          )}

          {profileState?.success && (
            <div className="rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span>Kişisel bilgileriniz başarıyla güncellendi.</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isProfilePending}
              className="h-11 px-6 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProfilePending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Bilgileri Güncelle</span>
            </button>
          </div>
        </form>

        {/* Security Banner */}
        <div className="rounded-2xl bg-rose-50/60 border border-rose-100/80 p-3.5 flex items-center gap-3 text-xs font-medium text-slate-600">
          <Lock className="h-4 w-4 text-[#C98484] shrink-0" />
          <span>
            Kişisel bilgileriniz yalnızca hesap güvenliğiniz ve teslimat takibiniz için kullanılır.
          </span>
        </div>
      </div>

      {/* Section 2: Şifre Değiştir Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-soft space-y-5">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
            <Lock className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Şifre Değiştir
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Hesap güvenliğinizi artırmak için düzenli olarak şifrenizi değiştirmenizi öneririz.
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-4" autoComplete="off">
          {/* Tarayıcı autocomplete tuzağı: gizli sahte alanlar */}
          <input type="text" name="fake_user" style={{ display: "none" }} readOnly tabIndex={-1} aria-hidden="true" />
          <input type="password" name="fake_pass" style={{ display: "none" }} readOnly tabIndex={-1} aria-hidden="true" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Yeni Şifre */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yeni Şifre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="new_password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute("readonly")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifrenizi girin"
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white focus:ring-2 focus:ring-[#C98484]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={newPassword} />
            </div>

            {/* Yeni Şifre Tekrarı */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yeni Şifre Tekrarı <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute("readonly")}
                  placeholder="Yeni şifrenizi tekrar girin"
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white focus:ring-2 focus:ring-[#C98484]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Security Notice Banner */}
          <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 flex items-center gap-3 text-xs font-medium text-slate-600">
            <ShieldCheck className="h-4 w-4 text-[#C98484] shrink-0" />
            <span>
              Şifreniz en az 10 karakter olmalı ve harf ile rakam içermelidir.
            </span>
          </div>

          {formState?.error && (
            <div className="rounded-2xl bg-red-50 p-3.5 text-xs font-bold text-red-600">
              {formState.error}
            </div>
          )}

          {formState?.success && (
            <div className="rounded-2xl bg-green-50 p-3.5 text-xs font-bold text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span>Şifreniz başarıyla güncellendi.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="reset"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C98484] hover:bg-rose-600 px-7 py-3 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Fatura Adresi Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
            <MapPin className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Fatura Adresi
            </h3>
            {billingAddress ? (
              <div className="text-xs text-slate-600 leading-relaxed space-y-0.5">
                <p className="font-bold text-slate-800">
                  {[billingAddress.first_name, billingAddress.last_name].filter(Boolean).join(" ") || fullName}
                </p>
                <p>
                  {billingAddress.address_1}
                  {billingAddress.address_2 && `, ${billingAddress.address_2}`}
                </p>
                <p className="text-slate-500">
                  {billingAddress.postal_code || "34110"},{" "}
                  {metadata.district || billingAddress.province ? `${metadata.district || billingAddress.province}, ` : ""}
                  {billingAddress.city || "İstanbul"}
                </p>
                <p className="text-slate-500">Türkiye</p>
              </div>
            ) : (
              <div className="text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800">{fullName}</p>
                <p className="text-slate-500">75. yıl caddesi elmas sitesi b1 23, Başakşehir</p>
                <p className="text-slate-500">34110, İstanbul</p>
                <p className="text-slate-500">Türkiye</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Link: Directly opens Adreslerim (/hesabim/adreslerim) page */}
        <LocalizedClientLink
          href="/hesabim/adreslerim"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#C98484] text-[#C98484] hover:bg-rose-50/50 px-6 py-3.5 text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          <span>Adreslerimde Düzenle</span>
          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
        </LocalizedClientLink>
      </div>
    </div>
  )
}
