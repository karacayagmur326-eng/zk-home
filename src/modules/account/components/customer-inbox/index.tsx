"use client"

import { MessageSquare, HelpCircle } from "@lib/icons"
import { useUrlState } from "@lib/hooks/use-url-state"
import CustomerMessages from "../customer-messages"

export default function CustomerInbox({ initialId = "" }: { initialId?: string }) {
  const [tab, setTab] = useUrlState<"messages" | "questions">("messages", "tab", ["messages", "questions"])
  return <div className="space-y-5">
    <div role="tablist" aria-label="Mesajlar ve ürün soruları" className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
      {([
        ["messages", "Mesajlarım", MessageSquare],
        ["questions", "Ürün Sorularım", HelpCircle],
      ] as const).map(([key, label, Icon]) => <button key={key} id={`inbox-tab-${key}`} role="tab" aria-selected={tab === key} aria-controls={`inbox-${key}`} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
        event.preventDefault()
        const next = event.key === "Home" ? "messages" : event.key === "End" ? "questions" : tab === "messages" ? "questions" : "messages"
        setTab(next)
        document.getElementById(`inbox-tab-${next}`)?.focus()
      }} type="button"
        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484] sm:flex-none ${tab === key ? "bg-[#C98484] text-white shadow-sm" : "text-slate-500 hover:bg-rose-50"}`}><Icon className="h-4 w-4 shrink-0" />{label}</button>)}
    </div>
    <div role="tabpanel" id={`inbox-${tab}`} aria-labelledby={`inbox-tab-${tab}`}>
      {tab === "questions" ? <CustomerMessages key="questions" kind="questions" initialId={initialId} /> : <CustomerMessages key="messages" initialId={initialId} />}
    </div>
  </div>
}
