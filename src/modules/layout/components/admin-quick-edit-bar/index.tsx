"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Edit3 } from "@lib/icons"

export default function AdminQuickEditBar() {
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof document !== "undefined" && !document.cookie.includes("admin")) {
      setIsAdmin(false)
      return
    }
    fetch("/api/admin/auth/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAdmin(true)
        }
      })
      .catch(() => setIsAdmin(false))
  }, [])

  if (!isAdmin) return null

  // Clean pathname from country codes like /tr
  const cleanPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/").replace(/\/$/, "") || "/"

  // Determine smart admin edit link & title based on current path
  let editUrl = "/admin"
  let label = "Sayfayı Düzenle"

  if (cleanPath.startsWith("/urunler/")) {
    const handle = cleanPath.replace("/urunler/", "")
    editUrl = `/admin/urunler/${handle}`
    label = "Ürünü Düzenle"
  } else if (cleanPath.startsWith("/urunler") || cleanPath.startsWith("/magaza")) {
    editUrl = "/admin/urunler"
    label = "Ürünleri Düzenle"
  } else if (cleanPath.startsWith("/kategoriler/")) {
    const handle = cleanPath.replace("/kategoriler/", "")
    editUrl = `/admin/kategoriler?duzenle=${handle}`
    label = "Kategoriyi Düzenle"
  } else if (cleanPath.startsWith("/kategoriler")) {
    editUrl = "/admin/kategoriler"
    label = "Kategorileri Düzenle"
  } else if (cleanPath.startsWith("/blog/")) {
    const slug = cleanPath.replace("/blog/", "")
    editUrl = `/admin/blog?duzenle=${slug}`
    label = "Yazıyı Düzenle"
  } else if (cleanPath === "/blog") {
    editUrl = "/admin/blog"
    label = "Blogu Düzenle"
  } else if (cleanPath === "/hakkimizda" || cleanPath === "/iletisim" || cleanPath === "/sss") {
    const pageHandle = cleanPath.replace("/", "")
    editUrl = `/admin/sayfalar?duzenle=${pageHandle}`
    label = "Sayfayı Düzenle"
  } else if (cleanPath === "/") {
    editUrl = "/admin/tema-ayarlari"
    label = "Ana Sayfayı Düzenle"
  } else {
    const pageHandle = cleanPath.replace("/", "")
    if (pageHandle) {
      editUrl = `/admin/sayfalar?duzenle=${pageHandle}`
      label = "Sayfayı Düzenle"
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-bounce-subtle">
      <Link
        href={editUrl}
        prefetch={false}
        className="flex items-center gap-2.5 px-5 py-3 bg-[#18191b] hover:bg-[#C98484] text-white rounded-full shadow-2xl border border-white/10 transition-all transform hover:scale-105 active:scale-95 group font-bold text-sm"
        title={`${label} (Admin Paneline Git)`}
      >
        <Edit3 className="w-4 h-4 text-white transition-transform group-hover:rotate-12" />
        <span className="tracking-tight">{label}</span>
      </Link>
    </div>
  )
}
