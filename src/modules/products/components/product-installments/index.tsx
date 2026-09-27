"use client"

import React, { useEffect, useState } from "react"
import { CreditCard, ShieldCheck, Sparkles, CheckCircle2, ChevronRight } from "lucide-react"
import clx from "clsx"

type InstallmentOption = {
  installmentNumber: number
  installmentPrice: number
  totalPrice: number
  monthlyFormatted: string
  totalFormatted: string
}

type BankDetail = {
  cardFamily: string
  bankName: string
  badgeBg: string
  badgeText: string
  installments: InstallmentOption[]
}

type ProductInstallmentsProps = {
  price?: number
}

// Bank Visual Theme Configurations
const BANK_THEMES: Record<
  string,
  {
    gradient: string
    accentColor: string
    subTitle: string
    cardType: string
    network: string
  }
> = {
  Bonus: {
    gradient: "from-emerald-700 via-emerald-800 to-emerald-950",
    accentColor: "#10b981",
    subTitle: "Garanti BBVA, TEB, Denizbank, Şekerbank",
    cardType: "Bonus Kredi Kartı",
    network: "Mastercard / Troy",
  },
  World: {
    gradient: "from-purple-800 via-indigo-900 to-purple-950",
    accentColor: "#a855f7",
    subTitle: "Yapı Kredi, Albaraka, Vakıfbank",
    cardType: "Worldcard",
    network: "Visa / Troy",
  },
  Maximum: {
    gradient: "from-pink-800 via-purple-900 to-slate-950",
    accentColor: "#ec4899",
    subTitle: "Türkiye İş Bankası",
    cardType: "Maximum Kart",
    network: "Visa / Troy",
  },
  Axess: {
    gradient: "from-amber-600 via-rose-700 to-neutral-900",
    accentColor: "#f59e0b",
    subTitle: "Akbank",
    cardType: "Axess & Wings",
    network: "Mastercard / Visa",
  },
  CardFinans: {
    gradient: "from-sky-700 via-blue-900 to-slate-950",
    accentColor: "#0284c7",
    subTitle: "QNB Finansbank",
    cardType: "CardFinans",
    network: "Visa / Mastercard",
  },
  Paraf: {
    gradient: "from-cyan-700 via-blue-800 to-indigo-950",
    accentColor: "#06b6d4",
    subTitle: "Halkbank",
    cardType: "Paraf Kart",
    network: "Mastercard / Troy",
  },
  Combo: {
    gradient: "from-red-700 via-red-800 to-neutral-950",
    accentColor: "#ef4444",
    subTitle: "Ziraat Bankası",
    cardType: "Bankkart Combo",
    network: "Troy / Visa",
  },
  Advantage: {
    gradient: "from-rose-800 via-red-950 to-neutral-950",
    accentColor: "#f43f5e",
    subTitle: "HSBC",
    cardType: "Advantage Kart",
    network: "Mastercard",
  },
  "Sağlam Kart": {
    gradient: "from-teal-800 via-teal-950 to-neutral-950",
    accentColor: "#14b8a6",
    subTitle: "Kuveyt Türk",
    cardType: "Sağlam Kart",
    network: "Troy / Visa",
  },
}

const ProductInstallments: React.FC<ProductInstallmentsProps> = ({ price = 0 }) => {
  const [banks, setBanks] = useState<BankDetail[]>([])
  const [selectedBank, setSelectedBank] = useState<string>("Bonus")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!price || price <= 0) {
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)

    fetch(`/api/catalog/installments?price=${price}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.ok && Array.isArray(data.banks)) {
          setBanks(data.banks)
          if (data.banks.length > 0 && !data.banks.some((b: BankDetail) => b.cardFamily === selectedBank)) {
            setSelectedBank(data.banks[0].cardFamily)
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [price])

  if (!price || price <= 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
        Bu ürün için geçerli bir fiyat bulunamadı.
      </div>
    )
  }

  const activeBankData = banks.find((b) => b.cardFamily === selectedBank) || banks[0]
  const activeTheme = BANK_THEMES[activeBankData?.cardFamily] || {
    gradient: "from-slate-800 to-slate-950",
    accentColor: "#C98484",
    subTitle: activeBankData?.bankName || "",
    cardType: activeBankData?.cardFamily + " Kart",
    network: "Visa / Mastercard / Troy",
  }

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Taksit Seçenekleri
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Anlaşmalı tüm banka ve kredi kartlarına 12 aya varan taksit seçenekleri
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>iyzico Korumalı Güvenli Ödeme</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
          <div className="lg:col-span-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="lg:col-span-8 h-96 bg-slate-50 rounded-2xl border border-slate-100" />
        </div>
      ) : banks.length === 0 ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          Taksit oranları yüklenemedi. Lütfen daha sonra tekrar deneyiniz.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT COLUMN: SOLDAN AŞAĞI KART GÖRSELLERİ VE LİSTESİ ── */}
          <div className="lg:col-span-4 flex flex-col space-y-2.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Banka & Kart Programı Seçin
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 max-h-[540px] overflow-y-auto pr-1 no-scrollbar">
              {banks.map((bank) => {
                const isSelected = bank.cardFamily === activeBankData?.cardFamily
                const theme = BANK_THEMES[bank.cardFamily] || {
                  gradient: "from-slate-700 to-slate-900",
                  accentColor: "#C98484",
                  subTitle: bank.bankName,
                  cardType: bank.cardFamily,
                  network: "Troy / Visa / Mastercard",
                }

                return (
                  <button
                    key={bank.cardFamily}
                    type="button"
                    onClick={() => setSelectedBank(bank.cardFamily)}
                    className={clx(
                      "w-full text-left p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 border relative overflow-hidden group",
                      isSelected
                        ? "border-[#C98484] bg-rose-50/40 shadow-sm ring-2 ring-[#C98484]/20"
                        : "border-slate-200/80 bg-white hover:border-rose-300 hover:bg-slate-50/80"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mini Realistic Card Graphic */}
                      <div
                        className={clx(
                          "w-12 h-8 rounded-lg bg-gradient-to-br shadow-2xs flex flex-col justify-between p-1 shrink-0 text-white relative overflow-hidden transition-transform duration-200 group-hover:scale-105",
                          theme.gradient
                        )}
                      >
                        {/* Chip / Graphic Detail */}
                        <div className="flex items-center justify-between">
                          <div className="w-2 h-1.5 rounded-xs bg-amber-300/80" />
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        </div>
                        <span className="text-[7px] font-black tracking-tight truncate">
                          {bank.cardFamily}
                        </span>
                      </div>

                      {/* Bank Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clx(
                              "text-xs font-black truncate",
                              isSelected ? "text-[#C98484]" : "text-slate-900"
                            )}
                          >
                            {bank.cardFamily}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium truncate block">
                          {theme.cardType}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#C98484] text-white flex items-center justify-center shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT COLUMN: SEÇİLEN KARTIN TAKSİT SEÇENEKLERİ TABLOSU ── */}
          <div className="lg:col-span-8">
            {activeBankData && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Visual Card Banner Header */}
                <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                  {/* Subtle Background Card Graphic Effect */}
                  <div
                    className={clx(
                      "absolute -right-6 -bottom-6 w-48 h-32 rounded-3xl bg-gradient-to-br opacity-25 blur-sm pointer-events-none",
                      activeTheme.gradient
                    )}
                  />

                  <div className="flex items-center gap-3.5 relative z-10">
                    {/* Realistic Detailed Card Badge */}
                    <div
                      className={clx(
                        "w-16 h-11 rounded-xl bg-gradient-to-br shadow-md flex flex-col justify-between p-1.5 shrink-0 text-white border border-white/20",
                        activeTheme.gradient
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-3 h-2 rounded-xs bg-amber-300" />
                        <span className="text-[8px] font-bold opacity-80 uppercase">
                          {activeBankData.cardFamily.slice(0, 3)}
                        </span>
                      </div>
                      <span className="text-[9px] font-black tracking-wide leading-none truncate">
                        {activeBankData.cardFamily}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-black text-white">
                          {activeBankData.cardFamily} Taksit Seçenekleri
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        {activeTheme.subTitle || activeBankData.bankName}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right relative z-10 shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Ürün Peşin Fiyatı
                    </span>
                    <span className="text-base sm:text-lg font-black text-white">
                      {price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                </div>

                {/* Taksit Seçenekleri Listesi / Tablosu */}
                <div className="p-2 sm:p-4">
                  <div className="divide-y divide-slate-100">
                    {activeBankData.installments.map((inst) => {
                      const isSingle = inst.installmentNumber === 1
                      const isFreeInstallment = isSingle || inst.installmentNumber === 3

                      return (
                        <div
                          key={inst.installmentNumber}
                          className={clx(
                            "py-3 px-3 sm:px-4 rounded-xl flex items-center justify-between gap-4 transition-colors hover:bg-slate-50",
                            isSingle ? "bg-emerald-50/40 border border-emerald-100/80 my-1" : ""
                          )}
                        >
                          {/* Radio Icon + Taksit Label */}
                          <div className="flex items-center gap-3">
                            <div
                              className={clx(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                isSingle
                                  ? "border-emerald-600 bg-emerald-600"
                                  : "border-slate-300 bg-white"
                              )}
                            >
                              {isSingle && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                                {isSingle ? "Tek Çekim (Peşin)" : `${inst.installmentNumber} Taksit`}
                              </span>

                              {isSingle && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                  Peşin Fiyatına
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Installment Pricing breakdown */}
                          <div className="text-right shrink-0">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isSingle && (
                                <span className="text-xs text-slate-500 font-semibold">
                                  {inst.installmentNumber} x
                                </span>
                              )}
                              <span className="font-black text-xs sm:text-sm text-[#C98484]">
                                {inst.monthlyFormatted}
                              </span>
                            </div>

                            {!isSingle && (
                              <span className="text-[10px] text-slate-400 font-medium block">
                                Toplam: {inst.totalFormatted}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer Info Callout */}
                <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#C98484]" />
                    <span>Ödeme anında kartınıza göre taksit seçenekleri aktifleşir.</span>
                  </div>
                  <span className="font-bold text-slate-700 hidden sm:inline">
                    256-Bit SSL Koruma
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductInstallments
