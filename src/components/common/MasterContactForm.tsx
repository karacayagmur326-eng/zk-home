"use client"

import React, { useId, useState } from "react"
import Link from "next/link"
import { User, Mail, Phone, ShoppingBag, Tag, MessageSquare, Send, Check } from "lucide-react"

export interface MasterContactFormProps {
  formTitle?: string
  formDescription?: string
  kvkkUrl?: string
  defaultSubject?: string
  initialName?: string
  initialEmail?: string
  initialPhone?: string
  initialOrderNo?: string
  className?: string
}

export default function MasterContactForm({
  formTitle = "Mesaj Gönderin",
  formDescription = "Formu doldurun; mesajınız destek ekibimize kaydedilsin.",
  kvkkUrl = "/gizlilik-politikasi",
  defaultSubject = "Genel Bilgi & Danışma",
  initialName = "",
  initialEmail = "",
  initialPhone = "",
  initialOrderNo = "",
  className = "",
}: MasterContactFormProps) {
  const kvkkCheckboxId = useId()
  const [formData, setFormData] = useState({
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
    order_no: initialOrderNo,
    subject: defaultSubject,
    message: "",
    kvkk: false,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [emailDraft, setEmailDraft] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage("")
    setEmailDraft("")

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage("Lütfen zorunlu olan Ad Soyad, E-Posta ve Mesaj alanlarını doldurun.")
      return
    }

    if (!formData.kvkk) {
      setErrorMessage("Devam etmek için KVKK Aydınlatma Metni'ni onaylamanız gerekmektedir.")
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
          order_no: formData.order_no,
          subject: formData.subject,
          message: formData.message,
        }),
      })

      let data: any = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (!res.ok) {
        throw new Error(data?.error || "Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.")
      }

      setSuccess(true)
      setFormData({
        name: initialName,
        email: initialEmail,
        phone: initialPhone,
        order_no: initialOrderNo,
        subject: defaultSubject,
        message: "",
        kvkk: false,
      })
    } catch (err: any) {
      setErrorMessage("Form şu anda iletilemedi. Mesajınızı e-posta uygulamanızla gönderebilirsiniz.")
      const recipient = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@zk-home.com"
      const body = `Ad: ${formData.name}\nE-posta: ${formData.email}\nTelefon: ${formData.phone}\nSipariş: ${formData.order_no}\n\n${formData.message}`
      setEmailDraft(`mailto:${recipient}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(body)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8 ${className}`}>
      
      {/* Header */}
      <div className="space-y-1 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-slate-900">
          <MessageSquare className="w-5 h-5 text-[#C98484]" />
          <h2 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight">
            {formTitle}
          </h2>
        </div>
        <p className="text-[0.8rem] text-slate-500 font-normal leading-relaxed pl-7">
          {formDescription}
        </p>
      </div>

      {success ? (
        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Mesajınız Alındı</h3>
          <p className="text-xs text-slate-600">
            Talebiniz kaydedildi. Kayıt onayı e-posta adresinize gönderildi; ekibimiz en kısa sürede yanıtlayacaktır.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Yeni Mesaj Gönder
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div role="alert" aria-live="polite" className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
              {errorMessage}
              {emailDraft && <a href={emailDraft} className="mt-2 block underline">E-posta uygulamasında aç</a>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ad Soyad */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C98484]" />
                <span>Adınız Soyadınız</span>
                <span className="text-[#C98484]">*</span>
              </label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Adınızı ve soyadınızı girin"
                className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#C98484] focus:bg-white transition"
              />
            </div>

            {/* E-Posta */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C98484]" />
                <span>E-Posta Adresi</span>
                <span className="text-[#C98484]">*</span>
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@eposta.com"
                className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#C98484] focus:bg-white transition"
              />
            </div>

            {/* Telefon */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C98484]" />
                <span>Telefon Numarası</span>
              </label>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="05xx xxx xx xx"
                className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#C98484] focus:bg-white transition"
              />
            </div>

            {/* Sipariş Numarası */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#C98484]" />
                <span>Sipariş Numarası</span>
                <span className="text-slate-400 font-normal text-[11px]">(İsteğe Bağlı)</span>
              </label>
              <input
                type="text"
                name="order_no"
                autoComplete="off"
                value={formData.order_no}
                onChange={(e) => setFormData({ ...formData, order_no: e.target.value })}
                placeholder="Örn: #1001"
                className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#C98484] focus:bg-white transition"
              />
            </div>
          </div>

          {/* İletişim Konusu */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#C98484]" />
              <span>İletişim Konusu</span>
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#C98484] focus:bg-white transition"
            >
              <option value="Genel Bilgi & Danışma">Genel Bilgi & Danışma</option>
              <option value="Toptan Satış & Kurumsal">Toptan Satış & Kurumsal</option>
              <option value="Sipariş & Teslimat">Sipariş & Teslimat</option>
              <option value="İade & Değişim">İade & Değişim</option>
              <option value="Teknik Destek & Garanti">Teknik Destek & Garanti</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          {/* Mesajınız */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#C98484]" />
              <span>Mesajınız</span>
              <span className="text-[#C98484]">*</span>
            </label>
            <textarea
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Talebinizi veya sorularınızı detaylıca yazabilirsiniz..."
              className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#C98484] focus:bg-white transition resize-y"
            />
          </div>

          {/* KVKK Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id={kvkkCheckboxId}
              checked={formData.kvkk}
              onChange={(e) => setFormData({ ...formData, kvkk: e.target.checked })}
              className="w-4 h-4 rounded text-[#C98484] focus:ring-[#C98484] border-slate-300 accent-[#C98484] cursor-pointer"
            />
            <label htmlFor={kvkkCheckboxId} className="text-xs text-slate-600 font-semibold cursor-pointer">
              Kişisel verilerinizin işlenmesine ilişkin{" "}
              <Link href={kvkkUrl} target="_blank" className="text-[#C98484] font-bold underline hover:text-[#A95E5E]">
                KVKK Aydınlatma Metni
              </Link>
              'ni okudum ve kabul ediyorum.
            </label>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3.5 rounded-2xl bg-[#C98484] hover:bg-[#A95E5E] text-white font-extrabold text-xs transition-all flex items-center gap-2.5 shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Gönderiliyor..." : "Mesaj Gönder"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
