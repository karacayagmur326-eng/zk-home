"use client"

import React, { useEffect, useState } from "react"
import { useFormState as useActionState } from "react-dom"
import { HttpTypes } from "@medusajs/types"
import { TURKEY_CITIES, getDistrictsForCity } from "@lib/util/turkey-cities"
import { addCustomerAddress, updateCustomerAddress, deleteCustomerAddress } from "@lib/data/customer"
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
  Trash,
  X,
  Briefcase,
  Loader2,
  ChevronDown,
} from "@lib/icons"

type AddressModalProps = {
  isOpen: boolean
  onClose: () => void
  address?: HttpTypes.StoreCustomerAddress | null
  region?: HttpTypes.StoreRegion
}

export default function CustomerAddressModal({
  isOpen,
  onClose,
  address,
}: AddressModalProps) {
  const isEditing = Boolean(address?.id)

  const metadata = (address?.metadata || {}) as Record<string, any>

  const [addressType, setAddressType] = useState<"bireysel" | "kurumsal">(
    metadata.address_type === "kurumsal" || address?.company ? "kurumsal" : "bireysel"
  )
  const [isDefaultShipping, setIsDefaultShipping] = useState<boolean>(
    Boolean(address?.is_default_shipping)
  )
  const [isDefaultBilling, setIsDefaultBilling] = useState<boolean>(
    Boolean(address?.is_default_billing)
  )

  const [selectedCity, setSelectedCity] = useState<string>(address?.city || "")
  const [districts, setDistricts] = useState<string[]>(
    address?.city ? getDistrictsForCity(address.city) : []
  )
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    metadata.district || address?.province || ""
  )

  // Kurumsal/Bireysel'e geçince şirket alanlarını sıfırla
  const handleAddressTypeChange = (type: "bireysel" | "kurumsal") => {
    if (type === addressType) return
    setAddressType(type)
    // Kurumsal'a geçince veya Bireysel'e geçince kurumsal alanları temizle
    // Adres bilgileri korunur (il, ilçe, adres), kişisel bilgiler korunur
    // Sadece şirket-spesifik alanlar sıfırlanır — bu form reset ile halledilir
  }

  const [isDeleting, setIsDeleting] = useState(false)

  const actionFn = isEditing ? updateCustomerAddress : addCustomerAddress
  const [formState, formAction, isPending] = useActionState(actionFn, {
    success: false,
    error: null,
  } as { success: boolean; error: string | null })

  useEffect(() => {
    if (formState?.success) {
      onClose()
    }
  }, [formState?.success, onClose])

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName)
    const newDistricts = getDistrictsForCity(cityName)
    setDistricts(newDistricts)
    if (newDistricts.length > 0) {
      setSelectedDistrict(newDistricts[0])
    } else {
      setSelectedDistrict("")
    }
  }

  const handleDelete = async () => {
    if (!address?.id) return
    setIsDeleting(true)
    try {
      await deleteCustomerAddress(address.id)
      onClose()
    } catch (err) {
      console.error("Delete error:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isEditing ? "Adresi Düzenle" : "Yeni Adres Ekle"}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Teslimat ve fatura bilgilerinizi güncelleyin
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-5">
          {isEditing && (
            <input type="hidden" name="addressId" value={address?.id} />
          )}

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
                    onClick={() => handleAddressTypeChange("bireysel")}
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
                    onClick={() => handleAddressTypeChange("kurumsal")}
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
                  defaultValue={metadata.address_title || address?.address_name || ""}
                  placeholder="Adres Başlığı (Ev, İş vb.)"
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_default_shipping"
                  checked={isDefaultShipping}
                  onChange={(e) => setIsDefaultShipping(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] accent-[#C98484]"
                />
                <span>Varsayılan teslimat adresi</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_default_billing"
                  checked={isDefaultBilling}
                  onChange={(e) => setIsDefaultBilling(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] accent-[#C98484]"
                />
                <span>Varsayılan fatura adresi</span>
              </label>
            </div>
          </div>

          {/* Section 1: KİŞİSEL VE İLETİŞİM BİLGİLERİ */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 space-y-3.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {addressType === "kurumsal" ? "KURUMSAL VE İLETİŞİM BİLGİLERİ" : "KİŞİSEL VE İLETİŞİM BİLGİLERİ"}
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
                    name="first_name"
                    required
                    defaultValue={address?.first_name || ""}
                    placeholder="Adınız"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
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
                    name="last_name"
                    required
                    defaultValue={address?.last_name || ""}
                    placeholder="Soyadınız"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
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
                    name="email"
                    defaultValue={metadata.email || ""}
                    placeholder="ornek@domain.com"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
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
                    name="phone"
                    required
                    defaultValue={address?.phone || ""}
                    placeholder="5XX XXX XX XX"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Kurumsal Bilgiler: Sadece Kurumsal seçildiğinde gösterilir */}
              {addressType === "kurumsal" && (
                <>
                  {/* Şirket */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Şirket Ünvanı <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        key={`company-${addressType}`}
                        type="text"
                        name="company"
                        required={addressType === "kurumsal"}
                        defaultValue={address?.company || ""}
                        placeholder="Şirket Tam Ünvanı"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
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
                        defaultValue={metadata.tax_office || ""}
                        placeholder="Vergi Dairesi Adı"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Vergi Numarası: Sadece Kurumsal seçildiğinde gösterilir */}
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
                      defaultValue={""}
                      placeholder="10 Haneli VKN"
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: ADRES BİLGİLERİ */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 space-y-3.5">
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
                    name="country_code"
                    disabled
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100/70 pl-9 pr-3 text-xs font-bold text-slate-700 appearance-none cursor-not-allowed"
                  >
                    <option value="tr">Türkiye</option>
                  </select>
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
                    name="city"
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
                    name="district"
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
                    type="text"
                    name="neighborhood"
                    defaultValue={metadata.neighborhood || ""}
                    placeholder="Mahalle adı"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
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
                    name="postal_code"
                    required
                    defaultValue={address?.postal_code || "34000"}
                    placeholder="34XXX"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
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
                    name="address_1"
                    required
                    defaultValue={address?.address_1 || ""}
                    placeholder="Cadde, sokak, bina ve kapı no yazın"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
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
                    name="address_2"
                    defaultValue={address?.address_2 || ""}
                    placeholder="Site adı, blok, daire no"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Security Notice */}
          <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-3 flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-[#C98484] shrink-0" />
            <span>
              Bilgileriniz güvenli şekilde saklanır ve yalnızca teslimat / faturalandırma işlemlerinde kullanılır.
            </span>
          </div>

          {/* Error feedback if any */}
          {formState?.error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">
              {formState.error}
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                  <span>Adresi Sil</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C98484] to-rose-600 px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
