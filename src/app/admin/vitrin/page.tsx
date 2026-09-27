"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VitrinYonetimiPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/ayarlar")
  }, [router])

  return (
    <div className="p-8 text-center text-slate-500 font-medium">
      Ayarlar sayfasına yönlendiriliyorsunuz...
    </div>
  )
}
