"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Edit3 } from "@lib/icons"

export default function AdminQuickEditBar() {
  const pathname = usePathname()
  const [target, setTarget] = useState<{ path: string; href: string; title: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/admin/quick-edit?path=${encodeURIComponent(pathname)}`, {
      cache: "no-store", signal: controller.signal,
    })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!controller.signal.aborted) {
          setTarget(data?.href ? { path: pathname, href: data.href, title: data.title } : null)
        }
      })
      .catch(() => { if (!controller.signal.aborted) setTarget(null) })
    return () => controller.abort()
  }, [pathname])

  if (!target || target.path !== pathname) return null

  return (
    <Link href={target.href} prefetch={false}
      className={`fixed ${pathname.startsWith("/urunler/") ? "bottom-[calc(216px+env(safe-area-inset-bottom))]" : "bottom-[calc(148px+env(safe-area-inset-bottom))]"} right-4 md:bottom-6 md:right-24 z-[80] inline-flex items-center gap-2 rounded-full bg-[#C98484] px-5 py-3 text-sm font-bold text-white shadow-lg border border-white/40 hover:bg-[#B87272] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C98484] transition-colors`}
      title={target.title} aria-label={target.title}>
      <Edit3 className="h-4 w-4" aria-hidden="true" />
      Düzenle
    </Link>
  )
}
