"use client"

import { FormEvent, useState } from "react"

export default function GiftInquiryForm() {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [sent, setSent] = useState(false)
  const [emailDraft, setEmailDraft] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setNotice("")
    const form = event.currentTarget
    const data = new FormData(form)
    const message = [
      `Kurum: ${data.get("company") || "Belirtilmedi"}`,
      `Etkinlik: ${data.get("occasion") || "Belirtilmedi"}`,
      `İlgilenilen örnek: ${data.get("example") || "Belirtilmedi"}`,
      `Tahmini adet: ${data.get("quantity") || "Belirtilmedi"}`,
      `Bütçe aralığı: ${data.get("budget") || "Belirtilmedi"}`,
      `Tercihler: ${data.get("preferences") || "Belirtilmedi"}`,
    ].join("\n")
    const recipient = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@zk-home.com"
    setEmailDraft(`mailto:${recipient}?subject=${encodeURIComponent("Kurumsal hediye talebi")}&body=${encodeURIComponent(`Ad: ${data.get("name")}\nE-posta: ${data.get("email")}\nTelefon: ${data.get("phone") || ""}\n\n${message}`)}`)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), email: data.get("email"), phone: data.get("phone"), subject: "Kurumsal hediye talebi", message }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Talep gönderilemedi.")
      setSent(true)
      form.reset()
    } catch (error) {
      setNotice("Form şu anda iletilemedi. Talebinizi e-posta uygulamanızla gönderebilirsiniz.")
    } finally {
      setBusy(false)
    }
  }

  if (sent) return <div role="status" className="rounded-2xl bg-green-50 p-6 text-green-900">Talebiniz alındı. Ekibimiz değerlendirdikten sonra size dönüş yapacak.</div>

  const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#bd8585] focus:outline-none"
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">Ad soyad *<input name="name" required minLength={2} maxLength={120} className={`mt-2 ${field}`} /></label>
      <label className="text-sm font-medium text-slate-700">Kurum adı<input name="company" maxLength={120} className={`mt-2 ${field}`} /></label>
      <label className="text-sm font-medium text-slate-700">E-posta *<input name="email" required type="email" maxLength={254} className={`mt-2 ${field}`} /></label>
      <label className="text-sm font-medium text-slate-700">Telefon<input name="phone" type="tel" maxLength={40} className={`mt-2 ${field}`} /></label>
      <label className="text-sm font-medium text-slate-700">Özel gün / etkinlik<input name="occasion" placeholder="Örn. yılbaşı" maxLength={100} className={`mt-2 ${field}`} /></label>
      <label className="text-sm font-medium text-slate-700">İlgilendiğiniz hediye örneği
        <select name="example" defaultValue="" className={`mt-2 ${field}`}>
          <option value="">Henüz karar vermedim</option>
          <option value="Yeni yıl kutuları">Yeni yıl kutuları</option>
          <option value="Kitap biçimli hediye kutuları">Kitap biçimli hediye kutuları</option>
          <option value="Dekoratif sunum hediyeleri">Dekoratif sunum hediyeleri</option>
          <option value="Kendi hediye fikrim">Kendi hediye fikrim</option>
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Tahmini adet<input name="quantity" type="number" min="1" className={`mt-2 ${field}`} /></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Tahmini bütçe aralığı<input name="budget" placeholder="Örn. kişi başı bütçe" maxLength={100} className={`mt-2 ${field}`} /></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Hediye tercihleri ve notlar *<textarea name="preferences" required minLength={5} maxLength={4000} rows={5} placeholder="Ürün türü, renk, teslim zamanı veya başka tercihleriniz" className={`mt-2 ${field}`} /></label>
      <p className="text-xs text-slate-500 sm:col-span-2">Göndererek iletişim bilgilerinizle talebiniz hakkında dönüş yapılmasını kabul edersiniz. <a href="/kvkk" className="underline">KVKK aydınlatma metni</a></p>
      {notice && <div role="alert" className="text-sm text-red-700 sm:col-span-2">{notice} {emailDraft && <a href={emailDraft} className="mt-2 block font-semibold underline">E-posta uygulamasında aç</a>}</div>}
      <button type="submit" disabled={busy} className="rounded-xl bg-[#bd8585] px-6 py-3 font-semibold text-white hover:bg-[#a96d6d] disabled:opacity-60 sm:col-span-2">{busy ? "Gönderiliyor..." : "Talebi gönder"}</button>
    </form>
  )
}
