"use client"

import { useRouter } from "next/navigation"
import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

export default function NewsletterAutoRefresh() {
  const router = useRouter()
  useAdminAutoRefresh(async () => { router.refresh() })
  return <p className="text-xs text-slate-500">Aboneler otomatik olarak güncellenir.</p>
}
