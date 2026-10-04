"use client"

import React, { useEffect, useRef, useState } from "react"
import { signup, type CustomerAuthState } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { TURKEY_CITIES, getDistrictsForCity } from "@lib/util/turkey-cities"
import { PasswordStrengthBar } from "../profile-template"
import {
  User,
  Mail,
  Phone,
  Building,
  Landmark,
  FileText,
  Globe,
  MapPin,
  Home,
  Bookmark,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  ArrowRight,
} from "@lib/icons"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, setMessage] = useState<CustomerAuthState>(null)
  const [isPending, setIsPending] = useState(false)
  const submitting = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [invalidFields, setInvalidFields] = useState<string[]>([])

  const [addressType, setAddressType] = useState<"bireysel" | "kurumsal">("bireysel")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMismatchError, setPasswordMismatchError] = useState<string | null>(null)

  const [selectedCity, setSelectedCity] = useState<string>("")
  const [districts, setDistricts] = useState<string[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>("")

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName)
    const newDistricts = getDistrictsForCity(cityName)
    setDistricts(newDistricts)
    setSelectedDistrict("")
  }

  const fieldProps = (name: string) => ({
    "aria-invalid": invalidFields.includes(name),
    "aria-describedby": invalidFields.includes(name) ? "register-validation-error" : undefined,
    onInput: () => setInvalidFields((fields) => fields.filter((field) => field !== name)),
  })

  const focusField = (form: HTMLFormElement, name: string) => {
    const field = form.elements.namedItem(name)
    if (field instanceof HTMLElement) {
      field.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
      field.focus({ preventScroll: true })
    }
  }

  useEffect(() => {
    if (!isPending && message?.state === "error" && message.field && formRef.current) {
      focusField(formRef.current, message.field)
    }
  }, [isPending, message])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting.current) return
    const form = e.currentTarget
    setMessage(null)
    setPasswordMismatchError(null)

    const fields = Array.from(form.elements).filter(
      (field): field is HTMLInputElement | HTMLSelectElement =>
        (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) &&
        !field.disabled && field.willValidate
    )
    const errors = fields.filter((field) => !field.validity.valid || (field.required && !field.value.trim()))
    if (errors.length) {
      setInvalidFields(errors.map((field) => field.name))
      const first = errors[0]
      const label = first.closest(".relative")?.parentElement?.querySelector("label")?.textContent?.replace("*", "").trim() || "Bu alan"
      setPasswordMismatchError(first.validity.typeMismatch ? `${label}: geçerli bir e-posta adresi girin.` : first.name === "password" && first.value ? "Şifre en az 10, en fazla 256 karakter olmalı." : `${label} alanını doldurun.`)
      focusField(form, first.name)
      return
    }
    if (password !== confirmPassword) {
      setInvalidFields(["password_confirm"])
      setPasswordMismatchError("Girdiğiniz şifreler birbiriyle eşleşmiyor.")
      focusField(form, "password_confirm")
      return
    }
    setInvalidFields([])
    submitting.current = true
    setIsPending(true)
    try {
      // An ordinary submit handler keeps the form intact when the server rejects it.
      const result = await signup(null, new FormData(form))
      setMessage(result)
      if (result?.state === "error" && result.field) {
        setInvalidFields([result.field])
      }
    } catch {
      setMessage({ state: "error", error: "Kayıt tamamlanamadı. Bilgileriniz korunuyor; lütfen tekrar deneyin." })
    } finally {
      submitting.current = false
      setIsPending(false)
    }
  }

  return (
    <div className="w-full space-y-6" data-testid="register-page">
      {message?.state === "verification_required" && (
        <div
          className="w-full rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-slate-700"
          data-testid="register-verification-message"
        >
          <strong>{message.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
          Lütfen gelen kutunuzu kontrol ederek e-postanızı doğrulayın, ardından giriş yapın.
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate autoComplete="off" className="w-full space-y-5 [&_[aria-invalid=true]]:border-red-500 [&_[aria-invalid=true]]:bg-red-50 [&_[aria-invalid=true]]:ring-2 [&_[aria-invalid=true]]:ring-red-200">
        <fieldset disabled={isPending || message?.state === "verification_required"} className="contents">
        {/* Top Options Box: Address Type, Address Title & Default Toggles */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-1">
                Adres Türü
              </span>

              {/* Segmented Control Toggle Buttons: Bireysel vs Kurumsal */}
              <div className="flex items-center rounded-xl bg-slate-200/70 p-1">
                <button
                  type="button"
                  onClick={() => setAddressType("bireysel")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    addressType === "bireysel"
                      ? "bg-white text-[#C98484] border border-[#C98484]/40 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Bireysel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAddressType("kurumsal")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    addressType === "kurumsal"
                      ? "bg-white text-[#C98484] border border-[#C98484]/40 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building className="h-3.5 w-3.5" />
                  <span>Kurumsal</span>
                </button>
              </div>
              <input type="hidden" name="address_type" value={addressType} />
            </div>

            {/* Adres Başlığı (Top Bar) */}
            <div className="relative min-w-[180px]">
              <Bookmark className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="address_title"
                defaultValue=""
                placeholder="Adres Başlığı (Ev, İş vb.)"
                className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-700 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_default_shipping"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] accent-[#C98484]"
              />
              <span>Varsayılan teslimat adresi</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_default_billing"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] accent-[#C98484]"
              />
              <span>Varsayılan fatura adresi</span>
            </label>
          </div>
        </div>

        {/* Section 1: KİŞİSEL / KURUMSAL İLETİŞİM BİLGİLERİ */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {addressType === "kurumsal" ? "KURUMSAL VE İLETİŞİM BİLGİLERİ" : "KİŞİSEL VE İLETİŞİM BİLGİLERİ"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {...fieldProps("first_name")}
                  required
                  autoComplete="off"
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
                  {...fieldProps("last_name")}
                  required
                  autoComplete="off"
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
                  {...fieldProps("email")}
                  required
                  autoComplete="off"
                  placeholder="ornek@domain.com"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {...fieldProps("phone")}
                  required
                  autoComplete="off"
                  placeholder="5XX XXX XX XX"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>

              {/* Şifre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Şifre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                  {...fieldProps("password")}
                    required
                    minLength={10}
                    maxLength={256}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 10 karakter"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthBar password={password} />
              </div>

            {/* Şifre Tekrarı */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Şifre Tekrarı <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirm"
                  {...fieldProps("password_confirm")}
                  required
                  minLength={10}
                  maxLength={256}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Kurumsal Bilgiler: Sadece Kurumsal seçildiğinde gösterilir */}
          {addressType === "kurumsal" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Şirket Ünvanı <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="company"
                  {...fieldProps("company")}
                    required={addressType === "kurumsal"}
                    placeholder="Şirket Tam Ünvanı"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vergi Dairesi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="tax_office"
                  {...fieldProps("tax_office")}
                    required={addressType === "kurumsal"}
                    placeholder="Vergi Dairesi Adı"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vergi Numarası (VKN) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="tax_number"
                  {...fieldProps("tax_number")}
                    required={addressType === "kurumsal"}
                    placeholder="10 Haneli VKN"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: ADRES BİLGİLERİ */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            ADRES BİLGİLERİ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Ülke */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ülke / Bölge
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  name="country_code"
                  disabled
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-100/70 pl-10 pr-3.5 text-xs font-bold text-slate-700 appearance-none cursor-not-allowed"
                >
                  <option value="tr">Türkiye</option>
                </select>
              </div>
            </div>

            {/* İl */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                İl <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                <select
                  name="city"
                  {...fieldProps("city")}
                  required
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all appearance-none cursor-pointer"
                >
                  <option value="">İl Seçiniz</option>
                  {TURKEY_CITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* İlçe */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                İlçe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                <select
                  name="district"
                  {...fieldProps("district")}
                  required
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all appearance-none cursor-pointer"
                >
                  <option value="">İlçe Seçiniz</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Mahalle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mahalle
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="neighborhood"
                  placeholder="Mahalle adı"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Posta Kodu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Posta Kodu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="postal_code"
                  {...fieldProps("postal_code")}
                  required
                  defaultValue=""
                  placeholder="34XXX"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Adres Satırı 1 */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Adres Satırı 1 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="address_1"
                  {...fieldProps("address_1")}
                  required
                  placeholder="Cadde, sokak, bina ve kapı no yazın"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Adres Satırı 2 */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Adres Satırı 2 (Apartman, daire, kat vb.)
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="address_2"
                  placeholder="Site adı, blok, daire no"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="rounded-2xl bg-rose-50/60 border border-rose-100 p-3.5 flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="h-4.5 w-4.5 text-[#C98484] shrink-0" />
          <span>
            Bilgileriniz güvenli şekilde saklanır ve yalnızca teslimat / faturalandırma işlemlerinde kullanılır.
          </span>
        </div>

        <div id="register-validation-error" role="alert" aria-live="polite">
          {passwordMismatchError && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-600">
              {passwordMismatchError}
            </div>
          )}
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />
        </div>

        {/* Submit Register Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          data-testid="register-button"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Üye Ol</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        </fieldset>
      </form>

      <div className="text-center pt-2">
        <span className="text-xs font-medium text-slate-500">
          Zaten hesabınız var mı?{" "}
          <button
            type="button"
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="font-bold text-[#C98484] hover:underline cursor-pointer"
          >
            Giriş Yap
          </button>
        </span>
      </div>
    </div>
  )
}

export default Register
