"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { X, Printer, ShieldCheck, FileText, Building2, User, MapPin, Phone, Mail, ShoppingBag } from "@lib/icons"
import { useSiteContact } from "@components/common/SellerQuestion"

type LegalContractsModalProps = {
  cart: HttpTypes.StoreCart | null
  customer?: HttpTypes.StoreCustomer | null
  liveFormData?: Record<string, any> | null
  activeModal: "on-bilgilendirme" | "mesafeli-satis" | null
  onClose: () => void
}

export default function LegalContractsModal({
  cart,
  customer,
  liveFormData,
  activeModal,
  onClose,
}: LegalContractsModalProps) {
  const siteContact = useSiteContact()
  const ZK_HOME_CORPORATE_INFO = {
    name: siteContact.companyName,
    address: siteContact.address,
    phone: siteContact.phone,
    phoneRaw: siteContact.phoneRaw,
    email: siteContact.email,
    web: siteContact.website,
    taxOffice: siteContact.taxOffice,
    taxNumber: siteContact.taxNumber,
    mersisNo: siteContact.mersisNo,
    tradeRegNo: siteContact.tradeRegNo,
    kepAddress: siteContact.kepAddress,
  }
  if (!activeModal) return null

  const isForm = activeModal === "on-bilgilendirme"
  const title = isForm ? "ÖN BİLGİLENDİRME FORMU" : "MESAFELİ SATIŞ SÖZLEŞMESİ"

  // Buyer Info Extracted From Live Form / Cart / Customer Session
  const buyerFirstName =
    liveFormData?.first_name ||
    cart?.shipping_address?.first_name ||
    customer?.first_name ||
    customer?.addresses?.[0]?.first_name ||
    ""
  const buyerLastName =
    liveFormData?.last_name ||
    cart?.shipping_address?.last_name ||
    customer?.last_name ||
    customer?.addresses?.[0]?.last_name ||
    ""
  const buyerFullName = `${buyerFirstName} ${buyerLastName}`.trim() || "Alıcı"

  const buyerEmail =
    liveFormData?.email ||
    cart?.email ||
    customer?.email ||
    "-"

  const buyerPhone =
    liveFormData?.phone ||
    cart?.shipping_address?.phone ||
    customer?.phone ||
    customer?.addresses?.[0]?.phone ||
    "-"

  const shippingAddr = cart?.shipping_address
  const savedAddr = customer?.addresses?.[0]

  const addr1 = liveFormData?.address_1 || shippingAddr?.address_1 || savedAddr?.address_1 || ""
  const addr2 = liveFormData?.address_2 || shippingAddr?.address_2 || savedAddr?.address_2 || ""
  const district = liveFormData?.province || liveFormData?.district || shippingAddr?.province || savedAddr?.province || ""
  const city = liveFormData?.city || shippingAddr?.city || savedAddr?.city || ""
  const postalCode = liveFormData?.postal_code || shippingAddr?.postal_code || savedAddr?.postal_code || ""
  const neighborhood = liveFormData?.neighborhood || ""

  const fullAddrParts = [
    addr1,
    addr2,
    neighborhood,
    district && city ? `${district} / ${city}` : (district || city),
    postalCode,
  ].filter(Boolean)

  const buyerDeliveryAddress = fullAddrParts.length > 0
    ? fullAddrParts.join(", ")
    : "Sipariş sırasında bildirilen teslimat adresi"

  const billingAddr = cart?.billing_address || shippingAddr
  const buyerBillingAddress = buyerDeliveryAddress

  const cartItems = cart?.items || []
  const subtotal = Number(cart?.subtotal || 0)
  const shippingTotal = Number(cart?.shipping_total || 0)
  const grandTotal = Number(cart?.total || 0)

  const currentDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden font-sans text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#C98484] border border-rose-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500 font-medium">
                ZK Home Sipariş Kodu: <span className="font-bold text-slate-700">{cart?.id || "Taslak Sipariş"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#C98484] transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Yazdır / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/70 text-slate-600 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable Text */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 select-text printable-contract">
          
          {/* Header Banner */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#C98484] uppercase tracking-wider">RESMİ YASAL BELGE</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Bu belge 6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca sipariş detaylarınızla otomatik oluşturulmuştur.
              </p>
            </div>
            <ShieldCheck className="h-8 w-8 text-[#C98484] shrink-0" />
          </div>

          {/* Section 1: TARAFLAR VE İLETİŞİM BİLGİLERİ */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-2">
              1. TARAFLAR VE BİLGİLER
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SATICI BİLGİLERİ */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2 text-xs">
                  <Building2 className="h-4 w-4 text-[#C98484]" />
                  <span>SATICI BİLGİLERİ</span>
                </div>
                <p><strong>Unvan:</strong> {ZK_HOME_CORPORATE_INFO.name}</p>
                <p><strong>Adres:</strong> {ZK_HOME_CORPORATE_INFO.address}</p>
                <p><strong>Telefon:</strong> {ZK_HOME_CORPORATE_INFO.phone}</p>
                <p><strong>E-Posta:</strong> {ZK_HOME_CORPORATE_INFO.email}</p>
                <p><strong>Vergi Dairesi & No:</strong> {ZK_HOME_CORPORATE_INFO.taxOffice} - {ZK_HOME_CORPORATE_INFO.taxNumber}</p>
                <p><strong>Mersis No:</strong> {ZK_HOME_CORPORATE_INFO.mersisNo}</p>
              </div>

              {/* ALICI BİLGİLERİ */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2 text-xs">
                  <User className="h-4 w-4 text-[#C98484]" />
                  <span>ALICI (TÜKETİCİ) BİLGİLERİ</span>
                </div>
                <p><strong>Ad Soyad:</strong> {buyerFullName}</p>
                <p><strong>E-Posta:</strong> {buyerEmail}</p>
                <p><strong>Telefon:</strong> {buyerPhone}</p>
                <p><strong>Teslimat Adresi:</strong> {buyerDeliveryAddress}</p>
                <p><strong>Fatura Adresi:</strong> {buyerBillingAddress}</p>
                <p><strong>Tarih:</strong> {currentDate}</p>
              </div>
            </div>
          </div>

          {/* Section 2: ÜRÜN VE SİPARİŞ ÖZETİ TABLOSU */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                2. SÖZLEŞME KONUSU ÜRÜN VE ÖDEME TABLOSU
              </h3>
              <span className="text-[10px] text-slate-400 font-medium sm:hidden">
                ← Kaydırın →
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs [scrollbar-width:thin]">
              <table className="w-full min-w-[500px] text-left text-xs text-slate-700">
                <thead className="bg-slate-100/90 text-slate-900 font-black border-b border-slate-200">
                  <tr>
                    <th className="p-3 whitespace-nowrap min-w-[180px]">Ürün Açıklaması</th>
                    <th className="p-3 text-center whitespace-nowrap w-20">Adet</th>
                    <th className="p-3 text-right whitespace-nowrap min-w-[110px]">Birim Fiyat</th>
                    <th className="p-3 text-right whitespace-nowrap min-w-[130px]">Toplam (KDV Dahil)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.length > 0 ? (
                    cartItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 leading-snug">
                          <span>{item.title}</span>
                          {item.variant?.title && item.variant.title !== "Default Variant" && (
                            <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                              {item.variant.title}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900 whitespace-nowrap">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-700 whitespace-nowrap">
                          {convertToLocale({ amount: Number(item.unit_price || 0), currency_code: "TRY" })}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 whitespace-nowrap">
                          {convertToLocale({ amount: Number(item.subtotal || 0), currency_code: "TRY" })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">Sepette ürün bulunmuyor.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="p-2.5 text-right text-slate-600 whitespace-nowrap">Ara Toplam (KDV Dahil):</td>
                    <td className="p-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                      {convertToLocale({ amount: subtotal, currency_code: "TRY" })}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-2.5 text-right text-slate-600 whitespace-nowrap">Kargo Bedeli:</td>
                    <td className="p-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                      {shippingTotal === 0 ? "Ücretsiz" : convertToLocale({ amount: shippingTotal, currency_code: "TRY" })}
                    </td>
                  </tr>
                  <tr className="bg-rose-50/80 border-t border-rose-200/60 text-[#C98484]">
                    <td colSpan={3} className="p-3.5 text-right font-black tracking-wide text-xs sm:text-sm whitespace-nowrap">
                      GENEL TOPLAM SİPARİŞ TUTARI:
                    </td>
                    <td className="p-3.5 text-right font-black text-sm sm:text-base whitespace-nowrap">
                      {convertToLocale({ amount: grandTotal, currency_code: "TRY" })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3: GENEL HÜKÜMLER */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-2">
              3. GENEL HÜKÜMLER VE TESLİMAT ŞARTLARI
            </h3>
            <p><strong>3.1.</strong> Satıcı, sözleşme konusu ürünü eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri, kullanım kılavuzları ile teslim etmeyi taahhüt eder.</p>
            <p><strong>3.2.</strong> Ürün, Alıcı veya Alıcı tarafından belirlenen adresteki üçüncü kişiye, yasal 30 günlük süreyi aşmamak koşulu ile anlaşmalı kargo şirketi ile teslim edilir.</p>
            <p><strong>3.3.</strong> Teslimat sırasında görünür bir hasar fark edilirse kargo görevlisiyle tutanak düzenlenmesi ve durumun Satıcı'ya bildirilmesi önerilir. Tutanak düzenlenmemiş olması tüketicinin yasal haklarını ortadan kaldırmaz.</p>
            <p><strong>3.4.</strong> Ödemenin gerçekleşmemesi veya banka tarafından iptal edilmesi halinde Satıcı’nın ürünü teslim yükümlülüğü sona erer.</p>
          </div>

          {/* Section 4: CAYMA HAKKI */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-2">
              4. CAYMA HAKKI VE İADE KOŞULLARI
            </h3>
            <p><strong>4.1.</strong> Alıcı, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin, malı teslim aldığı tarihten itibaren <strong>14 (on dört) gün</strong> içerisinde cayma hakkını kullanabilir.</p>
            <p><strong>4.2.</strong> Cayma hakkının kullanılması için bu süre içinde Satıcı'ya {ZK_HOME_CORPORATE_INFO.email} adresinden veya iletişim formundan bildirimde bulunulması yeterlidir. Gerekçe veya fotoğraf paylaşılması zorunlu değildir.</p>
            <p><strong>4.3.</strong> İade edilen ürün kutusu, ambalajı ve aksesuarlarıyla birlikte eksiksiz olarak gönderilmelidir.</p>
          </div>

          {/* Section 5: UYUŞMAZLIKLARIN ÇÖZÜMÜ */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-2">
              5. UYUŞMAZLIKLARIN ÇÖZÜMÜ VE YETKİLİ MAHKEME
            </h3>
            <p>İşbu sözleşmenin uygulanmasında, Ticaret Bakanlığınca ilan edilen parasal sınırlar dâhilinde Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.</p>
          </div>

          {/* Footer Approval */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <p>İşbu belge elektronik ortamda Alıcı onayına sunulmuş ve onay tarihinde yürürlüğe girmiştir.</p>
            <p className="font-bold text-slate-700">ZK Home © 2026 Tüm Hakları Saklıdır.</p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            Anladım, Kapat
          </button>
        </div>

      </div>
    </div>
  )
}
