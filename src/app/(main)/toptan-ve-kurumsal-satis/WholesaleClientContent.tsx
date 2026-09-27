"use client"

import React, { useState } from "react"
import Link from "next/link"
import { AppIcon } from "@lib/icons"
import {
  Phone,
  Mail,
  MapPin,
  Check,
  ArrowRight,
  FileText,
  ClipboardList,
  Package,
  Truck,
  CheckCircle,
  ChevronRight,
  Send,
  Award
} from "lucide-react"

export interface WholesaleInfoProps {
  info: Record<string, any>
}

export default function WholesaleClientContent({ info }: WholesaleInfoProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    sector: "",
    message: "",
  })

  const [loading, setLoading] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage("")

    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setErrorMessage("Lütfen zorunlu alanları (Ad Soyad, Telefon ve Mesaj) doldurun.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: `Toptan Satış Teklif Talebi (${formData.company || "Firma Belirtilmedi"} - ${formData.sector || "Genel"})`,
          message: `Firma: ${formData.company || "Belirtilmedi"}\nSektör: ${formData.sector || "Belirtilmedi"}\n\nMesaj:\n${formData.message}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Mesaj gönderilemedi.")
      }

      setSentSuccess(true)
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        sector: "",
        message: "",
      })
    } catch (err: any) {
      setErrorMessage(err.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10 w-full font-sans text-slate-800">
      
      {/* SECTION 1: 5-Feature Items Strip */}
      {/* SECTION 1: 6-Feature Bar (3x2 Grid) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-3 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Feature 1 */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start gap-3.5 group hover:bg-slate-100/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300 mt-0.5">
              <AppIcon name={info.feat1_icon || "tag"} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                {info.feat1_title || "Toptan Fiyat Avantajı"}
              </h3>
              <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                {info.feat1_desc || "Yüksek adetli alımlarda özel fiyatlandırma fırsatları."}
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start gap-3.5 group hover:bg-slate-100/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300 mt-0.5">
              <AppIcon name={info.feat2_icon || "package"} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                {info.feat2_title || "Güvenilir Tedarik"}
              </h3>
              <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                {info.feat2_desc || "Stoktan hızlı teslimat ve kesintisiz tedarik."}
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start gap-3.5 group hover:bg-slate-100/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300 mt-0.5">
              <AppIcon name={info.feat3_icon || "headphones"} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                {info.feat3_title || "Uzman Destek"}
              </h3>
              <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                {info.feat3_desc || "İhtiyacınıza uygun ürün ve çözüm önerileri."}
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start gap-3.5 group hover:bg-slate-100/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300 mt-0.5">
              <AppIcon name={info.feat4_icon || "wrench"} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                {info.feat4_title || "Özel Çözümler"}
              </h3>
              <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                {info.feat4_desc || "Projenize özel ürün, paketleme ve lojistik çözümleri."}
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start gap-3.5 group hover:bg-slate-100/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300 mt-0.5">
              <AppIcon name={info.feat5_icon || "receipt"} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                {info.feat5_title || "Fatura ve Ödeme"}
              </h3>
              <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                {info.feat5_desc || "Kolay fatura yönetimi ve esnek ödeme seçenekleri."}
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start gap-3.5 group hover:bg-slate-100/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300 mt-0.5">
              <AppIcon name={info.feat6_icon || "truck"} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                {info.feat6_title || "Hızlı Sevkiyat"}
              </h3>
              <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                {info.feat6_desc || "Türkiye geneli aynı gün kargo ve güvenli teslimat."}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: Neden ZK Home? & Kimler İçin Uygun? Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column (7 cols): Neden ZK Home? */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {info.why_title || "Neden Bizi Seçmelisiniz?"}
            </h2>
            <p className="text-xs sm:text-[0.8rem] text-slate-600 leading-relaxed font-normal">
              {info.why_desc || "Yılların deneyimi ve geniş ürün yelpazemizle, farklı sektörlerdeki işletmelerin üretim gücünü artırıyoruz. Kaliteyi uygun fiyatla buluşturuyor, işinizi büyütmenize katkı sağlıyoruz."}
            </p>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/60 text-center space-y-1.5 hover:border-rose-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-rose-100/70 text-[#C98484] flex items-center justify-center mx-auto mb-1">
                <AppIcon name={info.stat1_icon || "tag"} className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#C98484] tracking-tight">
                {info.stat1_value || "10.000+"}
              </div>
              <div className="text-[0.75rem] font-bold text-slate-700">
                {info.stat1_label || "Ürün Çeşidi"}
              </div>
            </div>

            <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/60 text-center space-y-1.5 hover:border-rose-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-rose-100/70 text-[#C98484] flex items-center justify-center mx-auto mb-1">
                <AppIcon name={info.stat2_icon || "users"} className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#C98484] tracking-tight">
                {info.stat2_value || "500+"}
              </div>
              <div className="text-[0.75rem] font-bold text-slate-700">
                {info.stat2_label || "Kurumsal Müşteri"}
              </div>
            </div>

            <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/60 text-center space-y-1.5 hover:border-rose-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-rose-100/70 text-[#C98484] flex items-center justify-center mx-auto mb-1">
                <AppIcon name={info.stat3_icon || "truck"} className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#C98484] tracking-tight">
                {info.stat3_value || "Hızlı"}
              </div>
              <div className="text-[0.75rem] font-bold text-slate-700">
                {info.stat3_label || "Teslimat"}
              </div>
            </div>

            <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/60 text-center space-y-1.5 hover:border-rose-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-rose-100/70 text-[#C98484] flex items-center justify-center mx-auto mb-1">
                <AppIcon name={info.stat4_icon || "award"} className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#C98484] tracking-tight">
                {info.stat4_value || "%100"}
              </div>
              <div className="text-[0.75rem] font-bold text-slate-700">
                {info.stat4_label || "Müşteri Memnuniyeti"}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column (5 cols): Kimler İçin Uygun? (Dark Card matching screenshot) */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-center border border-slate-800">
          
          {/* Subtle Handshake / Dark Overlay Effect */}
          <div className="absolute inset-0 bg-[url('/brand/about_warehouse.jpg')] bg-cover bg-center opacity-15 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {info.target_title || "Kimler İçin Uygun?"}
            </h3>

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-[0.8rem] text-slate-200 font-semibold">
              <li className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <Check className="w-4 h-4 text-[#C98484] shrink-0 stroke-[3]" />
                <span>{info.target_item1 || "Sanayi ve üretim tesisleri"}</span>
              </li>
              <li className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <Check className="w-4 h-4 text-[#C98484] shrink-0 stroke-[3]" />
                <span>{info.target_item2 || "İnşaat ve taahhüt firmaları"}</span>
              </li>
              <li className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <Check className="w-4 h-4 text-[#C98484] shrink-0 stroke-[3]" />
                <span>{info.target_item3 || "Otomotiv servis ve yedek parça bayileri"}</span>
              </li>
              <li className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <Check className="w-4 h-4 text-[#C98484] shrink-0 stroke-[3]" />
                <span>{info.target_item4 || "Perakende satış yapan işletmeler"}</span>
              </li>
              <li className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <Check className="w-4 h-4 text-[#C98484] shrink-0 stroke-[3]" />
                <span>{info.target_item5 || "Kamu kurum ve kuruluşları"}</span>
              </li>
              <li className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <Check className="w-4 h-4 text-[#C98484] shrink-0 stroke-[3]" />
                <span>{info.target_item6 || "Özel atölyeler ve teknik servisler"}</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* SECTION 3: Toptan Satış Sürecimiz (3x2 Grid Stepper) */}
      <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            {info.process_title || "Toptan Satış Sürecimiz"}
          </h2>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            6 adımda hızlı, güvenli ve sorunsuz kurumsal tedarik süreci:
          </p>
        </div>

        {/* 6-Step 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          
          {/* Step 1 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 hover:border-[#C98484] transition group">
            <div className="relative inline-block">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#C98484] text-white font-black text-xs flex items-center justify-center shadow-xs z-10">
                1
              </div>
              <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mx-auto text-slate-800 group-hover:border-[#C98484] group-hover:text-[#C98484] transition-colors shadow-xs">
                <FileText className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                {info.step1_title || "Talep"}
              </h4>
              <p className="text-[0.78rem] text-slate-500 font-normal leading-relaxed">
                {info.step1_desc || "İhtiyacınızı ve istediğiniz ürünleri bize iletin."}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 hover:border-[#C98484] transition group">
            <div className="relative inline-block">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#C98484] text-white font-black text-xs flex items-center justify-center shadow-xs z-10">
                2
              </div>
              <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mx-auto text-slate-800 group-hover:border-[#C98484] group-hover:text-[#C98484] transition-colors shadow-xs">
                <ClipboardList className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                {info.step2_title || "Teklif"}
              </h4>
              <p className="text-[0.78rem] text-slate-500 font-normal leading-relaxed">
                {info.step2_desc || "Size özel fiyat ve teslimat teklifimizi sunalım."}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 hover:border-[#C98484] transition group">
            <div className="relative inline-block">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#C98484] text-white font-black text-xs flex items-center justify-center shadow-xs z-10">
                3
              </div>
              <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mx-auto text-slate-800 group-hover:border-[#C98484] group-hover:text-[#C98484] transition-colors shadow-xs">
                <Package className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                {info.step3_title || "Sipariş"}
              </h4>
              <p className="text-[0.78rem] text-slate-500 font-normal leading-relaxed">
                {info.step3_desc || "Teklifinizi onaylayın, siparişinizi oluşturalım."}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 hover:border-[#C98484] transition group">
            <div className="relative inline-block">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#C98484] text-white font-black text-xs flex items-center justify-center shadow-xs z-10">
                4
              </div>
              <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mx-auto text-slate-800 group-hover:border-[#C98484] group-hover:text-[#C98484] transition-colors shadow-xs">
                <Truck className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                {info.step4_title || "Teslimat"}
              </h4>
              <p className="text-[0.78rem] text-slate-500 font-normal leading-relaxed">
                {info.step4_desc || "Ürünlerinizi hızlı ve güvenli şekilde teslim edelim."}
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 hover:border-[#C98484] transition group">
            <div className="relative inline-block">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#C98484] text-white font-black text-xs flex items-center justify-center shadow-xs z-10">
                5
              </div>
              <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mx-auto text-slate-800 group-hover:border-[#C98484] group-hover:text-[#C98484] transition-colors shadow-xs">
                <CheckCircle className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                {info.step5_title || "Destek"}
              </h4>
              <p className="text-[0.78rem] text-slate-500 font-normal leading-relaxed">
                {info.step5_desc || "Satış sonrası destekte yanınızda olalım."}
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 hover:border-[#C98484] transition group">
            <div className="relative inline-block">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#C98484] text-white font-black text-xs flex items-center justify-center shadow-xs z-10">
                6
              </div>
              <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mx-auto text-slate-800 group-hover:border-[#C98484] group-hover:text-[#C98484] transition-colors shadow-xs">
                <Award className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                {info.step6_title || "Memnuniyet"}
              </h4>
              <p className="text-[0.78rem] text-slate-500 font-normal leading-relaxed">
                {info.step6_desc || "Kesintisiz iş ortaklığı ve müşteri memnuniyeti takibi."}
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* SECTION 4: Size Özel Teklif Alın (Form & Contact Info matching screenshot) */}
      <section id="quote-form" className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (5 cols): Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                {info.form_title || "Size Özel Teklif Alın"}
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {info.form_desc || "İhtiyacınızı belirtin, en kısa sürede size geri dönüş yapalım."}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              
              {/* Phone */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <a href={`tel:${(info.phone || "0850 303 00 47").replace(/\s+/g, "")}`} className="font-bold text-sm text-slate-900 hover:text-[#C98484] transition-colors block">
                    {info.phone || "0850 303 00 47"}
                  </a>
                  <span className="text-slate-500 font-normal block text-xs">{info.phone_sub || "Hafta içi 09:00 - 18:00"}</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <a href={`mailto:${info.email || ""}`} className="font-bold text-sm text-slate-900 hover:text-[#C98484] transition-colors block">
                    {info.email || ""}
                  </a>
                  <span className="text-slate-500 font-normal block text-xs">{info.email_sub || "Ortalama yanıt süresi: 2 saat"}</span>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block mb-0.5">Adres</span>
                  <span className="text-slate-600 font-normal text-xs leading-relaxed block">{info.address || "İkitelli OSB Mah. İkbal Cad. No: 45/1 Başakşehir / İstanbul"}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column (7 cols): Form matching screenshot exact inputs */}
          <div className="lg:col-span-7">
            {sentSuccess ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-md">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Teklif Talebiniz Başarıyla Alındı!</h3>
                <p className="text-xs text-slate-600 font-normal">
                  Müşteri temsilcilerimiz en kısa sürede vermiş olduğunuz iletişim bilgilerinden sizinle irtibata geçecektir.
                </p>
                <button
                  type="button"
                  onClick={() => setSentSuccess(false)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                >
                  Yeni Talep Oluştur
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Adınız Soyadınız"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-11 px-4 text-xs bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:border-[#C98484] focus:bg-white transition-all text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder="E-posta Adresiniz"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-11 px-4 text-xs bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:border-[#C98484] focus:bg-white transition-all text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Firma Adı"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full h-11 px-4 text-xs bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:border-[#C98484] focus:bg-white transition-all text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Telefon Numaranız"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-11 px-4 text-xs bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:border-[#C98484] focus:bg-white transition-all text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full h-11 px-4 text-xs bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:border-[#C98484] focus:bg-white transition-all text-slate-800 font-semibold"
                  >
                    <option value="">Sektörünüzü Seçin</option>
                    <option value="Sanayi ve Üretim Tesisleri">Sanayi ve Üretim Tesisleri</option>
                    <option value="İnşaat ve Taahhüt Firmaları">İnşaat ve Taahhüt Firmaları</option>
                    <option value="Otomotiv Servis ve Yedek Parça">Otomotiv Servis ve Yedek Parça</option>
                    <option value="Perakende Satış Yapan İşletmeler">Perakende Satış Yapan İşletmeler</option>
                    <option value="Kamu Kurum ve Kuruluşları">Kamu Kurum ve Kuruluşları</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="Mesajınız"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-4 text-xs bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:border-[#C98484] focus:bg-white transition-all text-slate-900 font-semibold resize-none"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#C98484] hover:bg-[#A95E5E] text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
                  >
                    <span>{loading ? "Gönderiliyor..." : "Gönder"}</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  )
}
