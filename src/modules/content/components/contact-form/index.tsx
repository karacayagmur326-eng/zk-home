"use client"

import { Mail, MessageSquare, Phone, Send, User, Tag, ShoppingBag, CheckCircle2, AlertCircle } from "lucide-react"
import { FormEvent, useState } from "react"

export default function ContactForm({ kvkkUrl = "/kvkk" }: { kvkkUrl?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [kvkkChecked, setKvkkChecked] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!kvkkChecked) {
      setStatus("error")
      setErrorMsg("Devam etmek için KVKK aydınlatma metnini onaylamalısınız.")
      return
    }

    setStatus("sending")
    setErrorMsg("")
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        form.reset()
        setStatus("success")
      } else {
        const result = await response.json()
        setStatus("error")
        setErrorMsg(result.error || "Mesaj gönderilemedi. Lütfen bilgilerinizi kontrol edip tekrar deneyin.")
      }
    } catch {
      setStatus("error")
      setErrorMsg("Bağlantı hatası oluştu. Lütfen tekrar deneyin.")
    }
  }

  if (status === "success") {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-emerald-950 mb-2">Mesajınız Alındı!</h3>
        <p className="text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
          Talebiniz müşteri hizmetleri ekibimize iletilmiştir. En kısa süre içerisinde verdiğiniz iletişim bilgilerinden size geri dönüş yapılacaktır.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          Yeni Mesaj Gönder
        </button>
      </div>
    )
  }

  const fieldClass =
    "w-full rounded-xl border border-gray-200/90 bg-[#fafafa] px-4 py-3 text-xs text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-[#C98484] focus:ring-4 focus:ring-rose-500/10 hover:border-gray-300 font-medium"

  return (
    <form onSubmit={submit} className="space-y-6">
      {status === "error" && errorMsg && (
        <div role="alert" aria-live="polite" className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Row 1: Name & Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#C98484]" /> Adınız Soyadınız <span className="text-red-500">*</span>
          </label>
          <input
            className={fieldClass}
            name="name"
            autoComplete="name"
            placeholder="Adınızı ve soyadınızı girin"
            required
            minLength={2}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#C98484]" /> E-Posta Adresi <span className="text-red-500">*</span>
          </label>
          <input
            className={fieldClass}
            name="email"
            autoComplete="email"
            type="email"
            placeholder="ornek@eposta.com"
            required
          />
        </div>
      </div>

      {/* Row 2: Phone & Order No */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 inline-flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#C98484]" /> Telefon Numarası
          </label>
          <input
            className={fieldClass}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 inline-flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-[#C98484]" /> Sipariş Numarası <span className="text-[11px] font-medium text-gray-400">(İsteğe Bağlı)</span>
          </label>
          <input
            className={fieldClass}
            name="order_no"
            autoComplete="off"
            placeholder="Örn: #1001"
          />
        </div>
      </div>

      {/* Row 3: Subject */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 inline-flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#C98484]" /> İletişim Konusu
        </label>
        <div className="relative">
          <select className={`${fieldClass} appearance-none cursor-pointer pr-10`} name="subject" defaultValue="Genel Bilgi & Danışma">
            <option value="Genel Bilgi & Danışma">Genel Bilgi & Danışma</option>
            <option value="Sipariş / Kargo Durumu">Sipariş / Kargo Durumu</option>
            <option value="Ürün Danışma & Teknik Destek">Ürün Danışma & Teknik Destek</option>
            <option value="İade & Değişim Talebi">İade & Değişim Talebi</option>
            <option value="Kurumsal Hediye Talebi">Kurumsal Hediye Talebi</option>
            <option value="Öneri & Şikayet">Öneri & Şikayet</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Row 4: Message */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 inline-flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#C98484]" /> Mesajınız <span className="text-red-500">*</span>
        </label>
        <textarea
          className={`${fieldClass} min-h-[140px] resize-y leading-relaxed`}
          name="message"
          placeholder="Talebinizi veya sorularınızı detaylıca yazabilirsiniz..."
          required
          minLength={5}
        />
      </div>

      {/* KVKK Checkbox */}
      <div className="pt-1">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={kvkkChecked}
            onChange={(e) => setKvkkChecked(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#C98484] focus:ring-[#C98484] accent-[#C98484]"
          />
          <span className="text-xs text-gray-600 font-medium">
            Kişisel verilerinizin işlenmesine ilişkin <a href={kvkkUrl} target="_blank" rel="noopener noreferrer" className="text-[#C98484] underline font-bold hover:opacity-80">{`KVKK Aydınlatma Metni`}</a>'ni okudum ve kabul ediyorum.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C98484] px-8 py-3.5 text-xs font-black text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-[#d94f00] hover:shadow-rose-500/35 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {status === "sending" ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Mesaj Gönder
            </>
          )}
        </button>
      </div>
    </form>
  )
}
