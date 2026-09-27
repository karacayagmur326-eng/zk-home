"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { setAddresses, setShippingMethod } from "@lib/data/cart"
import { TURKEY_CITIES, getDistrictsForCity } from "@lib/util/turkey-cities"
import {
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  User,
  Building,
  Mail,
  Phone,
  ChevronDown,
  ArrowRight,
  Loader2,
  Bookmark,
  Landmark,
  FileText,
  Globe,
  Home,
  UserPlus,
} from "@lib/icons"
import PaymentButton from "../payment-button"
import LegalContractsModal from "../legal-contracts-modal"
import type { CheckoutPaymentMethod } from "@lib/data/payment"
import { convertToLocale } from "@lib/util/money"

export default function Addresses({
  cart,
  customer,
  paymentMethods,
  shippingOptions,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  paymentMethods: CheckoutPaymentMethod[]
  shippingOptions: Array<{
    id: string
    name: string
    amount: number
    metadata?: { coverage?: string; estimated_days?: string }
  }>
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentStep = searchParams.get("step") || "address"
  const isAddressOpen = currentStep === "address"

  const [activeLegalModal, setActiveLegalModal] = useState<"on-bilgilendirme" | "mesafeli-satis" | null>(null)

  // Find customer's default shipping address or first saved address
  const savedAddress =
    customer?.addresses?.find((a: any) => a.is_default_shipping) ||
    customer?.addresses?.[0]

  const savedMeta = (savedAddress?.metadata || {}) as Record<string, any>
  const isSavedKurumsal = Boolean(
    savedMeta.address_type === "kurumsal" &&
    savedAddress?.company &&
    String(savedAddress.company).trim().length > 0
  )

  const [addressType, setAddressType] = useState<"bireysel" | "kurumsal">(
    isSavedKurumsal ? "kurumsal" : "bireysel"
  )
  const [billingAddressType, setBillingAddressType] = useState<"bireysel" | "kurumsal">("bireysel")
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    cart?.payment_collection?.payment_sessions?.[0]?.provider_id ||
      paymentMethods[0]?.id ||
      ""
  )
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(
    cart?.shipping_methods?.[0]?.shipping_option_id ||
      cart?.shipping_methods?.[0]?.id ||
      ""
  )
  const [shippingReady, setShippingReady] = useState(
    Boolean(cart?.shipping_methods?.length)
  )
  const [shippingLoading, setShippingLoading] = useState(false)

  const chooseShippingMethod = async (id: string) => {
    if (!cart?.id || shippingLoading) return
    setShippingLoading(true)
    setErrorMsg(null)
    try {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      setSelectedShippingMethod(id)
      setShippingReady(true)
      router.refresh()
    } catch (error) {
      setShippingReady(false)
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Teslimat yöntemi seçilemedi."
      )
    } finally {
      setShippingLoading(false)
    }
  }

  // Real Customer / Saved Address / Cart prefilled data
  const defaultFirstName =
    savedAddress?.first_name ||
    customer?.first_name ||
    cart?.shipping_address?.first_name ||
    ""
  const defaultLastName =
    savedAddress?.last_name ||
    customer?.last_name ||
    cart?.shipping_address?.last_name ||
    ""
  const defaultEmail =
    savedMeta.email ||
    customer?.email ||
    cart?.email ||
    ""
  const defaultPhone =
    savedAddress?.phone ||
    customer?.phone ||
    cart?.shipping_address?.phone ||
    ""
  const defaultAddress1 =
    savedAddress?.address_1 ||
    cart?.shipping_address?.address_1 ||
    ""
  const defaultAddress2 =
    savedAddress?.address_2 ||
    cart?.shipping_address?.address_2 ||
    ""
  const defaultCompany =
    savedAddress?.company ||
    cart?.shipping_address?.company ||
    ""
  const defaultPostalCode =
    savedAddress?.postal_code ||
    cart?.shipping_address?.postal_code ||
    "34000"
  const defaultCity =
    savedAddress?.city ||
    cart?.shipping_address?.city ||
    "İstanbul"
  const defaultProvince =
    savedMeta.district ||
    savedAddress?.province ||
    cart?.shipping_address?.province ||
    "Başakşehir"
  const defaultNeighborhood =
    savedMeta.neighborhood ||
    ""
  const defaultDeliveryNote =
    savedMeta.delivery_note ||
    ""
  const defaultAddressTitle =
    savedMeta.address_title ||
    savedAddress?.address_name ||
    "Ev"

  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>(savedAddress?.id || "")

  const [selectedCity, setSelectedCity] = useState(defaultCity)
  const [selectedDistrict, setSelectedDistrict] = useState(defaultProvince)
  const [districts, setDistricts] = useState<string[]>([])

  const [billingSelectedCity, setBillingSelectedCity] = useState(defaultCity)
  const [billingSelectedDistrict, setBillingSelectedDistrict] = useState(defaultProvince)
  const [billingDistricts, setBillingDistricts] = useState<string[]>([])

  useEffect(() => {
    if (selectedCity) {
      const dists = getDistrictsForCity(selectedCity)
      setDistricts(dists)
      if (!dists.includes(selectedDistrict)) {
        setSelectedDistrict(dists[0] || "")
      }
    } else {
      setDistricts([])
      setSelectedDistrict("")
    }
  }, [selectedCity])

  useEffect(() => {
    if (billingSelectedCity) {
      const dists = getDistrictsForCity(billingSelectedCity)
      setBillingDistricts(dists)
      if (!dists.includes(billingSelectedDistrict)) {
        setBillingSelectedDistrict(dists[0] || "")
      }
    } else {
      setBillingDistricts([])
      setBillingSelectedDistrict("")
    }
  }, [billingSelectedCity])

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName)
    const dists = getDistrictsForCity(cityName)
    setDistricts(dists)
    setSelectedDistrict(dists[0] || "")
  }

  const handleBillingCityChange = (cityName: string) => {
    setBillingSelectedCity(cityName)
    const dists = getDistrictsForCity(cityName)
    setBillingDistricts(dists)
    setBillingSelectedDistrict(dists[0] || "")
  }

  const handleSelectSavedAddress = (addressId: string) => {
    const addr = customer?.addresses?.find((a) => a.id === addressId)
    if (!addr) return
    const meta = (addr.metadata || {}) as Record<string, any>

    const isKur = Boolean(
      meta.address_type === "kurumsal" &&
      addr.company &&
      String(addr.company).trim().length > 0
    )
    setAddressType(isKur ? "kurumsal" : "bireysel")

    setSelectedCity(addr.city || "İstanbul")
    setSelectedDistrict(meta.district || addr.province || "Başakşehir")

    // Update form elements via DOM
    const form = document.querySelector("#checkout-address-form") as HTMLFormElement
    if (form) {
      if (form["shipping_address.first_name"]) form["shipping_address.first_name"].value = addr.first_name || ""
      if (form["shipping_address.last_name"]) form["shipping_address.last_name"].value = addr.last_name || ""
      if (form["shipping_address.phone"]) form["shipping_address.phone"].value = addr.phone || ""
      if (form["shipping_address.address_1"]) form["shipping_address.address_1"].value = addr.address_1 || ""
      if (form["shipping_address.address_2"]) form["shipping_address.address_2"].value = addr.address_2 || ""
      if (form["shipping_address.postal_code"]) form["shipping_address.postal_code"].value = addr.postal_code || ""
      if (form["neighborhood"]) form["neighborhood"].value = meta.neighborhood || ""
      if (form["address_title"]) form["address_title"].value = meta.address_title || addr.address_name || "Ev"
      if (form["email"]) form["email"].value = meta.email || customer?.email || ""
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)

    // Ensure state-bound select inputs get correctly registered in FormData
    formData.set("shipping_address.city", selectedCity)
    formData.set("shipping_address.province", selectedDistrict)
    formData.set("billing_address.city", billingSelectedCity)
    formData.set("billing_address.province", billingSelectedDistrict)

    try {
      if (cart?.id) {
        const res = await setAddresses(null, formData)
        if (res && res.success === false) {
          setErrorMsg(res.error || "Adres kaydedilirken bir hata oluştu.")
          return
        }
      }
      router.push(pathname + "?step=delivery")
    } catch (err: any) {
      setErrorMsg(err.message || "Adres kaydedilirken bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 font-sans text-slate-900">
      {/* STEP 1: TESLİMAT ADRESİ (Active / Expandable) */}
      <div className="space-y-6 rounded-none sm:rounded-3xl border-x-0 sm:border border-y border-slate-200/80 sm:border-slate-100 bg-white p-4 sm:p-8 shadow-none sm:shadow-soft">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
              <MapPin className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Teslimat Adresi
              </h2>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Siparişinizin teslim edileceği adres bilgilerini girin.
              </p>
            </div>
          </div>

          {/* Kayıtlı Adresler (Adres Türü Tasarımıyla Birebir Aynı Tatlı Kapsayıcı) */}
          {customer?.addresses && customer.addresses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Kayıtlı Adres</span>
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                <div className="relative flex items-center">
                  <Bookmark className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#C98484] pointer-events-none z-10" />
                  <select
                    value={selectedSavedAddressId}
                    onChange={(e) => {
                      setSelectedSavedAddressId(e.target.value)
                      handleSelectSavedAddress(e.target.value)
                    }}
                    className="h-8 rounded-lg bg-white text-[#C98484] border border-[#C98484]/40 shadow-xs pl-7 pr-6 text-xs font-bold outline-none cursor-pointer appearance-none"
                  >
                    {customer.addresses.map((addr: any) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.metadata?.address_title || addr.address_name || "Ev"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#C98484] pointer-events-none" />
                </div>

                <a
                  href={`/hesabim/adreslerim?edit=${selectedSavedAddressId || "default"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#C98484] hover:bg-white transition-all cursor-pointer"
                >
                  <span>Düzenle</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {isAddressOpen ? (
          <form id="checkout-address-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              {/* Top Bar: Adres Türü + Hızlı Üyelik + Adres Başlığı */}
              <div className="pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Adres Türü & Bilgilerimle Üyelik Aç */}
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                      <span className="text-xs font-bold text-slate-700 shrink-0">Adres Türü</span>
                      <div className="grid grid-cols-2 items-center gap-1 rounded-xl bg-slate-200/70 p-1 ml-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setAddressType("bireysel")
                            setSelectedCity(defaultCity)
                            setSelectedDistrict(defaultProvince)
                          }}
                          className={`flex min-w-0 items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                          onClick={() => {
                            setAddressType("kurumsal")
                            setSelectedCity("")
                            setSelectedDistrict("")
                          }}
                          className={`flex min-w-0 items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

                    {/* Bilgilerimle Üyelik Oluştur Tatlı Rozet / Checkbox */}
                    <label className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50 px-2.5 py-2 text-center text-[11px] font-semibold text-[#C98484] shadow-2xs transition-all hover:bg-rose-100/70 cursor-pointer select-none sm:w-auto sm:px-3.5 sm:py-1.5 sm:text-xs sm:font-bold">
                      <input
                        type="checkbox"
                        name="create_account"
                        defaultChecked
                        className="h-4 w-4 rounded border-rose-300 text-[#C98484] focus:ring-[#C98484] accent-[#C98484]"
                      />
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Bu bilgilerimle hızlı üyelik oluştur</span>
                    </label>
                  </div>

                  {/* Adres Başlığı */}
                  <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[180px]">
                    <Bookmark className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      key={`title-${addressType}`}
                      type="text"
                      name="address_title"
                      defaultValue={addressType === "kurumsal" ? "" : defaultAddressTitle}
                      placeholder="Adres Başlığı (Ev, İş vb.)"
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 1: KİŞİSEL / KURUMSAL VE İLETİŞİM BİLGİLERİ */}
              <div className="space-y-3.5 pt-4">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {addressType === "kurumsal"
                    ? "KURUMSAL VE İLETİŞİM BİLGİLERİ"
                    : "KİŞİSEL VE İLETİŞİM BİLGİLERİ"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Ad */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`fn-${addressType}`}
                        type="text"
                        name="shipping_address.first_name"
                        required
                        defaultValue={addressType === "kurumsal" ? "" : defaultFirstName}
                        placeholder="Adınız"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Soyad */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Soyad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`ln-${addressType}`}
                        type="text"
                        name="shipping_address.last_name"
                        required
                        defaultValue={addressType === "kurumsal" ? "" : defaultLastName}
                        placeholder="Soyadınız"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                      />
                    </div>
                  </div>

                  {/* E-posta */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`email-${addressType}`}
                        type="email"
                        name="email"
                        required
                        defaultValue={addressType === "kurumsal" ? "" : defaultEmail}
                        placeholder="ornek@domain.com"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Telefon */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`phone-${addressType}`}
                        type="tel"
                        name="shipping_address.phone"
                        required
                        defaultValue={addressType === "kurumsal" ? "" : defaultPhone}
                        placeholder="5XX XXX XX XX"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Kurumsal Bilgiler */}
                  {addressType === "kurumsal" && (
                    <>
                      {/* Şirket Ünvanı */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Şirket Ünvanı <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <input
                            key={`company-${addressType}`}
                            type="text"
                            name="shipping_address.company"
                            required={addressType === "kurumsal"}
                            defaultValue=""
                            placeholder="Şirket Tam Ünvanı"
                            className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Vergi Dairesi */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Vergi Dairesi <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <input
                            key={`tax_office-${addressType}`}
                            type="text"
                            name="tax_office"
                            required={addressType === "kurumsal"}
                            defaultValue=""
                            placeholder="Vergi Dairesi Adı"
                            className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Vergi Numarası */}
                {addressType === "kurumsal" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="md:col-start-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Vergi Numarası (VKN) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          key={`tax_number-${addressType}`}
                          type="text"
                          name="tax_number"
                          required={addressType === "kurumsal"}
                          defaultValue=""
                          placeholder="10 Haneli VKN"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: ADRES BİLGİLERİ */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100 mt-4">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  ADRES BİLGİLERİ
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  {/* Ülke */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ülke / Bölge
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <select
                        name="shipping_address.country_code"
                        disabled
                        defaultValue="tr"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100/70 pl-9 pr-3 text-xs font-bold text-slate-700 appearance-none cursor-not-allowed"
                      >
                        <option value="tr">Türkiye</option>
                      </select>
                      <input type="hidden" name="shipping_address.country_code" value="tr" />
                    </div>
                  </div>

                  {/* İl */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      İl <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                      <select
                        key={`city-${addressType}`}
                        name="shipping_address.city"
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">İl Seçiniz</option>
                        {TURKEY_CITIES.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* İlçe */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      İlçe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                      <select
                        key={`district-${addressType}`}
                        name="shipping_address.province"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">İlçe Seçiniz</option>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Mahalle */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mahalle
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`neighborhood-${addressType}`}
                        type="text"
                        name="neighborhood"
                        defaultValue={addressType === "kurumsal" ? "" : defaultNeighborhood}
                        placeholder="Mahalle adı"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Posta Kodu */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Posta Kodu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`postal-${addressType}`}
                        type="text"
                        name="shipping_address.postal_code"
                        required
                        defaultValue={addressType === "kurumsal" ? "" : defaultPostalCode}
                        placeholder="34XXX"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Adres Satırı 1 */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Adres Satırı 1 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`addr1-${addressType}`}
                        type="text"
                        name="shipping_address.address_1"
                        required
                        defaultValue={addressType === "kurumsal" ? "" : defaultAddress1}
                        placeholder="Cadde, sokak, bina ve kapı no yazın"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Adres Satırı 2 */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Adres Satırı 2 (Apartman, daire, kat vb.)
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`addr2-${addressType}`}
                        type="text"
                        name="shipping_address.address_2"
                        defaultValue={addressType === "kurumsal" ? "" : defaultAddress2}
                        placeholder="Site adı, blok, daire no"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox: Same as Billing (Unchecked by default) */}
            <div className="pt-1 pb-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  name="same_as_billing"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] accent-[#C98484]"
                />
                <span>Fatura adresi teslimat adresi ile aynı</span>
              </label>
            </div>

            {/* Conditional Billing Address Section */}
            {!sameAsBilling && (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-xs sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Fatura Adresi Bilgileri
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      Faturanızın kesileceği adres ve mükellef bilgilerini girin.
                    </p>
                  </div>

                  {/* Bireysel / Kurumsal Toggle for Billing Address */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBillingAddressType("bireysel")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        billingAddressType === "bireysel"
                          ? "bg-white text-[#C98484] border border-[#C98484]/40 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>Bireysel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBillingAddressType("kurumsal")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        billingAddressType === "kurumsal"
                          ? "bg-white text-[#C98484] border border-[#C98484]/40 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Building className="h-3.5 w-3.5" />
                      <span>Kurumsal</span>
                    </button>
                  </div>
                  <input
                    type="hidden"
                    name="billing_address_type"
                    value={billingAddressType}
                  />
                </div>

                {/* Section 1: KİŞİSEL / KURUMSAL VE İLETİŞİM BİLGİLERİ */}
                <div className="space-y-3.5 pt-3">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {billingAddressType === "kurumsal"
                      ? "KURUMSAL VE İLETİŞİM BİLGİLERİ"
                      : "KİŞİSEL VE İLETİŞİM BİLGİLERİ"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Ad */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ad <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          name="billing_address.first_name"
                          required
                          defaultValue={defaultFirstName}
                          placeholder="Adınız"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Soyad */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Soyad <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          name="billing_address.last_name"
                          required
                          defaultValue={defaultLastName}
                          placeholder="Soyadınız"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>

                    {/* E-posta */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        E-posta
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          name="billing_email"
                          defaultValue={defaultEmail}
                          placeholder="ornek@domain.com"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Telefon */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Telefon <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="tel"
                          name="billing_address.phone"
                          required
                          defaultValue={defaultPhone}
                          placeholder="5XX XXX XX XX"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Kurumsal Bilgiler */}
                    {billingAddressType === "kurumsal" && (
                      <>
                        {/* Şirket Ünvanı */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Şirket Ünvanı <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              name="billing_address.company"
                              required={billingAddressType === "kurumsal"}
                              defaultValue={defaultCompany}
                              placeholder="Şirket Tam Ünvanı"
                              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                            />
                          </div>
                        </div>

                        {/* Vergi Dairesi */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Vergi Dairesi <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              name="billing_tax_office"
                              required={billingAddressType === "kurumsal"}
                              placeholder="Vergi Dairesi Adı"
                              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Vergi Numarası */}
                  {billingAddressType === "kurumsal" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="md:col-start-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Vergi Numarası (VKN) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            name="billing_tax_number"
                            required={billingAddressType === "kurumsal"}
                            placeholder="10 Haneli VKN"
                            className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: ADRES BİLGİLERİ */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100 mt-4">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    FATURA ADRES BİLGİLERİ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                    {/* Ülke */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ülke / Bölge
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                          name="billing_address.country_code"
                          disabled
                          defaultValue="tr"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100/70 pl-9 pr-3 text-xs font-bold text-slate-700 appearance-none cursor-not-allowed"
                        >
                          <option value="tr">Türkiye</option>
                        </select>
                        <input type="hidden" name="billing_address.country_code" value="tr" />
                      </div>
                    </div>

                    {/* İl */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        İl <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                        <select
                          name="billing_address.city"
                          value={billingSelectedCity}
                          onChange={(e) => handleBillingCityChange(e.target.value)}
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">İl Seçiniz</option>
                          {TURKEY_CITIES.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* İlçe */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        İlçe <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                        <select
                          name="billing_address.province"
                          value={billingSelectedDistrict}
                          onChange={(e) => setBillingSelectedDistrict(e.target.value)}
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">İlçe Seçiniz</option>
                          {billingDistricts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Mahalle */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mahalle
                      </label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          name="billing_neighborhood"
                          defaultValue={defaultNeighborhood}
                          placeholder="Mahalle adı"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Posta Kodu */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Posta Kodu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          name="billing_address.postal_code"
                          required
                          defaultValue={defaultPostalCode}
                          placeholder="34XXX"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Adres Satırı 1 */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Adres Satırı 1 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          name="billing_address.address_1"
                          required
                          defaultValue={defaultAddress1}
                          placeholder="Cadde, sokak, bina ve kapı no yazın"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Adres Satırı 2 */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Adres Satırı 2 (Apartman, daire, kat vb.)
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          name="billing_address.address_2"
                          defaultValue={defaultAddress2}
                          placeholder="Site adı, blok, daire no"
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-3 flex items-center gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-[#C98484] shrink-0" />
              <span>
                Bilgileriniz güvenli şekilde saklanır ve yalnızca teslimat / faturalandırma işlemlerinde kullanılır.
              </span>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">
                {errorMsg}
              </div>
            )}

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Ödeme Adımına Geç</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>
              {defaultFirstName} {defaultLastName} — {defaultAddress1}, {selectedCity} / {selectedDistrict}
            </span>
            <button
              type="button"
              onClick={() => router.push(pathname + "?step=address")}
              className="text-xs font-bold text-[#C98484] hover:underline"
            >
              Düzenle
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-none sm:rounded-3xl border-x-0 sm:border border-y border-slate-200/80 sm:border-slate-100 bg-white p-4 sm:p-8 shadow-none sm:shadow-soft">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100/60">
            <Truck className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Teslimat Yöntemi
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Yönetim panelinde tanımlanan teslimat seçeneklerinden birini seçin.
            </p>
          </div>
        </div>
        {shippingOptions.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {shippingOptions.map((option) => (
              <label
                key={option.id}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition-colors ${
                  selectedShippingMethod === option.id
                    ? "border-[#C98484] bg-rose-50/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="shipping_method"
                    value={option.id}
                    checked={selectedShippingMethod === option.id}
                    disabled={shippingLoading}
                    onChange={() => chooseShippingMethod(option.id)}
                    className="mt-1 h-4 w-4 accent-[#C98484]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900">
                      {option.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {option.metadata?.estimated_days || "Teslimat süresi belirtilmedi"}
                      {" · "}
                      {option.amount === 0
                        ? "Ücretsiz"
                        : convertToLocale({
                            amount: option.amount,
                            currency_code: "TRY",
                          })}
                    </span>
                  </span>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Kullanılabilir teslimat yöntemi bulunmuyor. Yönetim panelindeki
            kargo ayarlarını tamamlayın.
          </div>
        )}
      </div>

      {/* STEP: ÖDEME */}
      <div className="space-y-4 rounded-none sm:rounded-3xl border-x-0 sm:border border-y border-slate-200/80 sm:border-slate-100 bg-white p-4 sm:p-8 shadow-none sm:shadow-soft">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
            <CreditCard className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Ödeme Yöntemi
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Yönetim panelinde etkinleştirilen ödeme yöntemlerinden birini seçin.
            </p>
          </div>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`block rounded-2xl border-2 p-5 cursor-pointer transition-colors ${
                  selectedPaymentMethod === method.id
                    ? "border-[#C98484] bg-rose-50/30"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment_provider"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={() => setSelectedPaymentMethod(method.id)}
                    className="h-5 w-5 accent-[#C98484]"
                  />
                  <span className="text-sm font-bold text-slate-900">
                    {method.label}
                  </span>
                </div>
                <p className="mt-2 pl-8 text-xs font-medium text-slate-600">
                  {method.description}
                </p>
              </label>
            ))}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#C98484]"
              />
              <span className="text-xs font-medium leading-5 text-slate-700">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveLegalModal("on-bilgilendirme")
                  }}
                  className="font-bold text-[#C98484] underline hover:text-rose-700 cursor-pointer"
                >
                  Ön Bilgilendirme Formu
                </button>
                ’nu ve{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveLegalModal("mesafeli-satis")
                  }}
                  className="font-bold text-[#C98484] underline hover:text-rose-700 cursor-pointer"
                >
                  Mesafeli Satış Sözleşmesi
                </button>
                ’ni okudum ve kabul ediyorum. Siparişin ödeme yükümlülüğü
                doğurduğunu biliyorum.
              </span>
            </label>
            <div className="pt-2">
              <PaymentButton
                cart={cart!}
                providerId={selectedPaymentMethod}
                data-testid="submit-order-button"
                termsAccepted={termsAccepted && shippingReady}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Kullanılabilir ödeme yöntemi bulunmuyor. Yönetim panelinden gerçek
            ödeme entegrasyonu veya doğrulanmış havale hesabı etkinleştirilmelidir.
          </div>
        )}
      </div>

      {/* Dynamic Legal Contracts Modal */}
      <LegalContractsModal
        cart={cart}
        customer={customer}
        liveFormData={(() => {
          if (typeof document === "undefined") return null
          const form = document.querySelector("#checkout-address-form") as HTMLFormElement
          if (!form) {
            return {
              first_name: defaultFirstName,
              last_name: defaultLastName,
              email: defaultEmail,
              phone: defaultPhone,
              address_1: defaultAddress1,
              address_2: defaultAddress2,
              city: selectedCity,
              province: selectedDistrict,
              postal_code: defaultPostalCode,
              neighborhood: defaultNeighborhood,
              company: defaultCompany,
            }
          }
          return {
            first_name: form["shipping_address.first_name"]?.value || defaultFirstName,
            last_name: form["shipping_address.last_name"]?.value || defaultLastName,
            email: form["email"]?.value || defaultEmail,
            phone: form["shipping_address.phone"]?.value || defaultPhone,
            address_1: form["shipping_address.address_1"]?.value || defaultAddress1,
            address_2: form["shipping_address.address_2"]?.value || defaultAddress2,
            city: selectedCity,
            province: selectedDistrict,
            postal_code: form["shipping_address.postal_code"]?.value || defaultPostalCode,
            neighborhood: form["neighborhood"]?.value || defaultNeighborhood,
            company: form["shipping_address.company"]?.value || defaultCompany,
          }
        })()}
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />
    </div>
  )
}
