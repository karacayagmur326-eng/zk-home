"use client"

import { FormEvent, useState } from "react"
import { ArrowRight, Mail } from "@lib/icons"

export default function EditorialNewsletter({ title, description }: { title: string; description: string }) {
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!consent || saving) return
    setSaving(true)
    setMessage("")
    try {
      const form = new FormData()
      form.set("email", email.trim())
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: form,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Kayıt tamamlanamadı.")
      setEmail("")
      setConsent(false)
      setMessage("E-posta tercihiniz kaydedildi. Teşekkür ederiz.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kayıt tamamlanamadı.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#f3e5df] px-5 py-7 sm:px-8 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:px-12">
      <div className="absolute -right-10 -top-12 h-56 w-56 rounded-full bg-white/30 blur-2xl" />
      <div className="relative flex items-start gap-4 lg:max-w-[45%]">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#d7aaa6] bg-white/65 text-[#bd797b]">
          <Mail className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-[#352f2d] sm:text-xl">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#766d69]">{description}</p>
        </div>
      </div>
      <form onSubmit={submit} className="relative mt-5 w-full lg:mt-0 lg:max-w-[48%]">
        <div className="flex overflow-hidden rounded-full border border-[#e8d4cc] bg-white shadow-sm">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="E-posta adresiniz"
            aria-label="E-posta adresiniz"
            className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm text-[#352f2d] outline-none placeholder:text-[#aaa09c]"
          />
          <button type="submit" disabled={!consent || saving} className="m-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#C98484] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#a95e62] disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Kaydediliyor" : "Kayıt Ol"}<ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <label className="mt-2 flex items-start gap-2 text-[11px] leading-4 text-[#766d69]">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-[#C98484]" />
          Kampanya, yenilik ve ilham içerikleri için e-posta almak istiyorum.
        </label>
        {message && <p role="status" className="mt-2 text-xs font-semibold text-[#9d5e61]">{message}</p>}
      </form>
    </section>
  )
}
