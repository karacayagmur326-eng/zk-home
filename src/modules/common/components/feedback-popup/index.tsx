"use client"

import { Dialog, DialogPanel, DialogTitle, Description } from "@headlessui/react"
import { Info, X } from "@lib/icons"

export default function FeedbackPopup({ message, onClose, title = "İşlem tamamlanamadı" }: {
  message: string
  onClose: () => void
  title?: string
}) {
  return <Dialog open={Boolean(message)} onClose={onClose} className="relative z-[200]">
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel className="relative w-full max-w-md rounded-3xl border border-rose-100 bg-white p-7 shadow-2xl">
        <button onClick={onClose} aria-label="Uyarıyı kapat" className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-[#C98484]"><X className="h-5 w-5" /></button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484]"><Info className="h-6 w-6" /></div>
        <DialogTitle className="text-lg font-bold text-slate-900">{title}</DialogTitle>
        <Description className="mt-3 text-sm leading-6 text-slate-600">{message}</Description>
        <button onClick={onClose} className="mt-6 w-full rounded-xl bg-[#C98484] px-5 py-3 font-bold text-white transition hover:bg-[#b87373] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C98484]">Tamam</button>
      </DialogPanel>
    </div>
  </Dialog>
}
