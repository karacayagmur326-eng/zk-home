"use client"
import { useSiteContact } from "@components/common/SellerQuestion"

import { FormEvent, useState } from "react"

import { Mail, Send } from "@lib/icons"
import { Button, Input } from "@modules/common/components/ui"

export default function Newsletter() {
  const siteContact = useSiteContact()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setIsError(true)
      setMessage("Geçerli bir e-posta adresi girin.")
      return
    }

    localStorage.setItem("zkhome-newsletter-email", normalizedEmail)
    setIsError(false)
    setMessage("E-bülten tercihiniz bu cihazda kaydedildi.")
    setEmail("")
  }

  return (
    <section
      aria-labelledby="newsletter-title"
      className="content-container py-12 sm:py-16"
    >
      <div className="relative isolate overflow-hidden rounded-desktop-wide bg-foreground px-6 py-10 text-background shadow-elevated sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14">
        <Mail
          aria-hidden="true"
          className="absolute -right-8 -top-10 -z-10 h-52 w-52 opacity-[0.06]"
          strokeWidth={1}
        />
        <div className="max-w-xl">
          <p className="text-xs font-black tracking-[0.16em] text-primary">
            YENİLİKLERDEN HABERDAR OLUN
          </p>
          <h2
            id="newsletter-title"
            className="mt-2 text-3xl font-black sm:text-4xl"
          >
            {siteContact.brandName} e-bültenine katılın
          </h2>
          <p className="mt-3 text-sm leading-relaxed opacity-75 sm:text-base">
            Yeni ürünler, kullanım rehberleri ve kampanya duyuruları için
            e-posta tercihinizi kaydedin.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 w-full max-w-lg lg:mt-0"
          noValidate
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              name="newsletter-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="E-posta adresi"
              placeholder="ornek@eposta.com"
              autoComplete="email"
              required
              containerClassName="flex-1"
              className="bg-background text-foreground"
            />
            <Button type="submit" className="h-12 shrink-0 px-6">
              Kaydet
              <Send aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-3 text-xs opacity-65">
            Tercihinizi dilediğiniz zaman değiştirebilirsiniz. E-posta gönderim
            entegrasyonu ilgili fazda etkinleştirilecektir.
          </p>
          {message && (
            <p
              role={isError ? "alert" : "status"}
              className={`mt-3 text-sm font-semibold ${
                isError ? "text-danger" : "text-success"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
