"use client"
import { useRef, useState } from "react"
import { MessageSquare, Send, X, CheckCircle } from "lucide-react"

export default function CustomerMessageButton({ customerId, orderId, label, orderNumber, compact = false }: {
  customerId?: string; orderId?: string; label: string; orderNumber?: number; compact?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const sending = useRef(false)
  const requestKey = useRef("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const open = () => {
    requestKey.current = crypto.randomUUID()
    setSubject(orderNumber ? `#${orderNumber} numaralı siparişiniz hakkında` : "ZK Home müşteri desteği")
    setMessage(""); setError(""); setResult(null)
    dialog.current?.showModal()
  }
  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    if (sending.current) return
    sending.current = true; setPending(true); setError("")
    try {
      const response = await fetch("/api/admin/customer-messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId,orderId,subject,message,requestId: requestKey.current }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Mesaj gönderilemedi.")
      setResult(data.emailSent ? "Mesaj müşteri mesaj kutusuna kaydedildi ve e-postası gönderildi." : "Mesaj müşteri mesaj kutusuna kaydedildi. E-posta gönderimi yeniden denenmek üzere kuyrukta.")
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Bağlantı hatası. Tekrar deneyebilirsiniz.") }
    finally { sending.current = false; setPending(false) }
  }
  return <>
    <button type="button" onClick={open} title="Müşteriye mesaj gönder" aria-label={`${label} müşterisine mesaj gönder`} className={compact ? "rounded-lg p-1.5 text-[#B98787] transition-colors hover:bg-[#faf1ed] hover:text-[#986969]" : "inline-flex items-center gap-2 rounded-xl border border-[#e8d5ce] bg-[#faf5f2] px-3 py-2 text-xs font-semibold text-[#986969] hover:bg-[#f5e9e3]"}><MessageSquare className="h-4 w-4"/>{!compact && "Mesaj gönder"}</button>
    <dialog ref={dialog} onCancel={event => { if (pending) event.preventDefault() }} className="fixed left-1/2 top-1/2 m-0 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-0 text-left shadow-2xl backdrop:bg-slate-950/40" aria-labelledby={`compose-${customerId || orderId}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h2 id={`compose-${customerId || orderId}`} className="text-base font-semibold text-slate-900">Müşteriye mesaj gönder</h2><p className="mt-1 break-all text-xs text-slate-500">{label}</p></div><button type="button" disabled={pending} onClick={() => dialog.current?.close()} aria-label="Mesaj penceresini kapat" className="rounded-full p-2 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4"/></button></div>
      {result ? <div className="space-y-4 p-5"><p role="status" className="flex gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle className="h-5 w-5 shrink-0"/>{result}</p><p className="text-xs text-slate-500">Yazışmayı İletişim &amp; Mesajlar bölümünden takip edebilirsiniz. Müşteri aynı konuşmadan yanıt verebilir.</p><button type="button" onClick={() => dialog.current?.close()} className="rounded-xl bg-[#B98787] px-5 py-2.5 text-sm text-white">Kapat</button></div> : <form onSubmit={send} className="space-y-4 p-5">
        <p className="rounded-xl bg-[#faf5f2] p-3 text-xs leading-relaxed text-slate-600">Mesaj e-posta olarak gönderilir ve üyenin Mesajlarım bölümünde görünür. Misafir müşteriler e-postadan iletişime devam edebilir.</p>
        <label className="block text-xs font-medium text-slate-700">Konu<input autoFocus required maxLength={180} disabled={pending} value={subject} onChange={event => { setSubject(event.target.value); requestKey.current = crypto.randomUUID() }} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#B98787]"/></label>
        <label className="block text-xs font-medium text-slate-700">Mesaj<textarea required minLength={3} maxLength={10000} rows={6} disabled={pending} value={message} onChange={event => { setMessage(event.target.value); requestKey.current = crypto.randomUUID() }} placeholder="Müşteriye iletmek istediğiniz bilgileri yazın..." className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#B98787]"/></label>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        <div className="flex justify-end"><button disabled={pending} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#B98787] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"><Send className="h-4 w-4"/>{pending ? "Gönderiliyor..." : "Mesajı gönder"}</button></div>
      </form>}
    </dialog>
  </>
}
