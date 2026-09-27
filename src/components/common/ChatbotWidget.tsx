"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, ExternalLink, MessageCircle, MessagesSquare, Send, X } from "lucide-react"
import { FormEvent, useEffect, useRef, useState } from "react"
import { ChatbotSettings } from "@lib/chatbot/config"
import { useSellerQuestion } from "./SellerQuestion"
import ChatbotRichText from "./ChatbotRichText"

type ChatMessage = {
  id: string
  role: "bot" | "user"
  text: string
  linkUrl?: string
  linkText?: string
  fallback?: boolean
  products?: Array<{ title: string; url: string; price: string; thumbnail?: string; available: boolean }>
  source?: string
}

export default function ChatbotWidget({
  settings,
  whatsappUrl = "",
  whatsappText = "WhatsApp ile iletişime geç",
}: {
  settings: ChatbotSettings
  whatsappUrl?: string
  whatsappText?: string
}) {
  const { open: openSellerQuestion } = useSellerQuestion()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [channelsOpen, setChannelsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "bot", text: settings.welcome_message },
  ])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const updateViewport = () => setIsMobileViewport(media.matches)
    updateViewport()
    media.addEventListener("change", updateViewport)
    return () => media.removeEventListener("change", updateViewport)
  }, [])

  useEffect(() => {
    if (!open || !isMobileViewport) return

    const html = document.documentElement
    const body = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousBodyPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - html.clientWidth

    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousBodyPaddingRight
    }
  }, [isMobileViewport, open])

  const hasChatbot = settings.enabled
  const hasWhatsApp = Boolean(whatsappUrl)
  const hasMobileProductBar = pathname.startsWith("/urunler/")
  const launcherPosition = hasMobileProductBar
    ? "bottom-[calc(148px+env(safe-area-inset-bottom))]"
    : "bottom-[calc(80px+env(safe-area-inset-bottom))]"
  const popupPosition = hasMobileProductBar
    ? "bottom-[calc(216px+env(safe-area-inset-bottom))] top-[max(12px,env(safe-area-inset-top))]"
    : "bottom-[calc(148px+env(safe-area-inset-bottom))] top-[max(12px,env(safe-area-inset-top))]"

  if ((!hasChatbot && !hasWhatsApp) || pathname.startsWith("/admin")) return null

  async function ask(question: string) {
    const clean = question.trim()
    if (!clean || loading) return
    setInput("")
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: clean },
    ])
    setLoading(true)
    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: clean,
          unanswered_count: messages.filter((item) => item.fallback).length,
          history: messages.slice(-6).map(({ role, text }) => ({ role, text })),
        }),
      })
      const data = await response.json()
      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: data.answer || data.error || settings.fallback_message,
          linkUrl: data.link_url,
          linkText: data.link_text,
          fallback: data.needs_human === true || !data.matched,
          products: Array.isArray(data.products) ? data.products : undefined,
          source: data.source,
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        { id: `bot-${Date.now()}`, role: "bot", text: settings.fallback_message, fallback: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void ask(input)
  }

  const quickQuestions = settings.questions.filter((item) => item.active).slice(0, 4)

  return (
    <>
      {open && (
        <section
          className={`fixed left-[max(10px,env(safe-area-inset-left))] right-[max(10px,env(safe-area-inset-right))] z-[120] box-border flex min-h-0 min-w-0 max-w-none flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.24)] sm:left-auto sm:right-3 sm:w-[calc(100dvw-1.5rem)] sm:max-w-[390px] sm:rounded-3xl md:bottom-24 md:right-5 md:top-auto md:z-[88] md:h-[min(620px,calc(100vh-8rem))] md:min-h-[280px] ${popupPosition}`}
          aria-label={`${settings.bot_name} sohbet penceresi`}
          aria-modal={isMobileViewport}
          role="dialog"
        >
          <header className="flex min-w-0 shrink-0 items-center gap-2.5 px-3.5 py-3.5 text-white sm:gap-3 sm:px-4 sm:py-4" style={{ background: settings.accent_color }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:h-11 sm:w-11">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="storefront-section-title truncate text-[15px] text-white">{settings.bot_name}</h2>
              <p className="mt-0.5 text-[11px] font-medium tracking-[-0.01em] text-white/85">Çevrimiçi · Hızlı destek</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25" aria-label="Sohbeti kapat">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 min-w-0 flex-1 touch-pan-y space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain bg-slate-50 px-2.5 py-3.5 sm:px-3 sm:py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`min-w-0 max-w-[88%] overflow-hidden break-words [overflow-wrap:anywhere] rounded-2xl px-3.5 py-3 text-[13px] leading-5 tracking-[-0.01em] shadow-sm ${message.role === "user" ? "rounded-br-md text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700"}`} style={message.role === "user" ? { background: settings.accent_color } : undefined}>
                  {message.role === "bot"
                    ? <ChatbotRichText>{message.text}</ChatbotRichText>
                    : <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>}
                  {message.linkUrl && (
                    <Link href={message.linkUrl} className="mt-2.5 inline-flex items-center gap-1 font-extrabold" style={{ color: settings.accent_color }} onClick={() => { if (isMobileViewport) setOpen(false) }}>
                      {message.linkText || "İncele"}<ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <Link
                          key={product.url}
                          href={product.url}
                          onClick={() => { if (isMobileViewport) setOpen(false) }}
                          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2 transition hover:border-rose-300 hover:bg-rose-50"
                        >
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt="" className="h-11 w-11 flex-none rounded-lg border border-slate-200 bg-white object-contain" />
                          ) : (
                            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-white text-lg">🛠️</span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block line-clamp-2 text-[11px] font-extrabold leading-4 text-slate-800">{product.title}</span>
                            <span className="mt-0.5 block text-[11px] font-black" style={{ color: settings.accent_color }}>{product.price}</span>
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 flex-none text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.fallback && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="mb-2 text-[11px] font-extrabold text-slate-800">Ekibimiz hemen yardımcı olsun:</p>
                      <div className="flex flex-wrap gap-2">
                        {hasWhatsApp && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-[11px] font-extrabold text-white transition hover:brightness-95"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp'tan Yaz
                          </a>
                        )}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-extrabold"
                          style={{ color: settings.accent_color }}
                          onClick={() => {
                            setOpen(false)
                            openSellerQuestion({ subject: "Genel Bilgi & Danışma" })
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> İletişim Formu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {messages.length === 1 && quickQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {quickQuestions.map((item) => (
                  <button key={item.id} type="button" onClick={() => void ask(item.question)} className="rounded-full border border-rose-200 bg-white px-3 py-2 text-left text-[11px] font-bold text-slate-700 transition hover:border-rose-400 hover:text-[#C98484]">
                    {item.question}
                  </button>
                ))}
              </div>
            )}
            {loading && <div className="inline-flex rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-400">Yanıt hazırlanıyor…</div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="grid w-full min-w-0 shrink-0 grid-cols-[minmax(0,1fr)_44px] items-center gap-2 overflow-hidden border-t border-slate-200 bg-white p-2.5 sm:p-3">
            <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} placeholder={settings.input_placeholder} className="h-11 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-base outline-none transition focus:border-rose-400 focus:bg-white sm:text-sm" />
            <button type="submit" disabled={!input.trim() || loading} className="flex h-11 w-full min-w-0 items-center justify-center rounded-xl text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40" style={{ background: settings.accent_color }} aria-label="Soruyu gönder">
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
          <div className="bg-white pb-2 text-center text-[9px] font-semibold text-slate-400">Yanıtlar genel bilgilendirme amaçlıdır.</div>
        </section>
      )}

      {channelsOpen && !open && (
        <div className={`fixed right-3 z-[88] flex w-[min(300px,calc(100vw-1.5rem))] flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_18px_50px_rgba(15,23,42,.2)] md:bottom-24 md:right-5 ${hasMobileProductBar ? "bottom-[calc(216px+env(safe-area-inset-bottom))]" : "bottom-[calc(148px+env(safe-area-inset-bottom))]"}`}>
          <div className="px-2 pb-1.5 pt-1">
            <h2 className="storefront-section-title text-[15px] text-slate-900">Size nasıl yardımcı olabiliriz?</h2>
            <p className="mt-1 text-[10.5px] font-medium leading-4 tracking-[-0.01em] text-slate-500">Dilediğiniz iletişim kanalından bize ulaşın.</p>
          </div>
          {hasChatbot && (
            <button
              type="button"
              onClick={() => { setChannelsOpen(false); setOpen(true) }}
              className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/70 p-3.5 text-left transition hover:border-rose-300 hover:bg-rose-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: settings.accent_color }}><Bot className="h-5 w-5" /></span>
              <span><span className="storefront-card-title block text-[13px] text-slate-900">{settings.bot_name}</span><span className="mt-0.5 block text-[10.5px] font-medium leading-4 tracking-[-0.01em] text-slate-500">Ürün ve siparişleriniz için hızlı destek</span></span>
            </button>
          )}
          {hasWhatsApp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setChannelsOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white"><WhatsAppIcon className="h-5 w-5" /></span>
              <span><span className="storefront-card-title block text-[13px] text-slate-900">WhatsApp</span><span className="mt-0.5 block text-[10.5px] font-medium leading-4 tracking-[-0.01em] text-slate-500">{whatsappText}</span></span>
            </a>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (open) setOpen(false)
          else if (hasWhatsApp) setChannelsOpen((current) => !current)
          else setOpen(true)
        }}
        className={`fixed right-4 z-[88] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_12px_32px_rgba(201,132,132,.35)] transition hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200 md:bottom-5 md:right-5 ${launcherPosition}`}
        style={{ background: settings.accent_color }}
        aria-expanded={open || channelsOpen}
        aria-label={open || channelsOpen ? "İletişim menüsünü kapat" : "İletişim seçeneklerini aç"}
        title="Yardım ve iletişim"
      >
        {open || channelsOpen ? <X className="h-6 w-6" /> : <MessagesSquare className="h-7 w-7" />}
      </button>
    </>
  )
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true"><path d="M12 2a9.6 9.6 0 0 0-8.3 14.4L2.4 21.6l5.3-1.4A9.6 9.6 0 1 0 12 2Zm0 17.5c-1.4 0-2.8-.4-4-1.1l-.3-.2-3.1.8.8-3-.2-.3A7.8 7.8 0 1 1 12 19.5Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.8c-.1.2-.3.2-.5.1-1.4-.7-2.4-1.4-3.3-3-.2-.3.2-.4.6-1 .1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.8.8-1.1 1.8-.8 2.9.4 1.9 1.8 3.6 3.4 4.7 1.6 1.1 4.1 2.2 5.7 1.3.5-.3.9-1 1-1.6.1-.3.1-.6-.1-.7-.1-.2-.4-.3-.7-.5Z" /></svg>
}
