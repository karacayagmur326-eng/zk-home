"use client"

import { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export default function OrderTrackingSearch({ orderPlaceholder, emailPlaceholder, buttonText }: { orderPlaceholder: string; emailPlaceholder: string; buttonText: string }) {
  const router = useRouter()
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push("/hesabim/siparislerim")
  }
  return (
    <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
      <input name="order" required placeholder={orderPlaceholder} className="h-11 rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-[#C98484]" />
      <input name="email" required type="email" placeholder={emailPlaceholder} className="h-11 rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-[#C98484]" />
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C98484] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#d94e00] sm:w-fit">{buttonText} <Search className="h-4 w-4" /></button>
    </form>
  )
}
