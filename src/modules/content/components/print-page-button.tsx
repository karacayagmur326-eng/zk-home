"use client"

import { Download } from "lucide-react"

export default function PrintPageButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-xs font-extrabold text-[#C98484] transition hover:bg-rose-50"
    >
      PDF / Yazdır <Download className="h-3.5 w-3.5" />
    </button>
  )
}
