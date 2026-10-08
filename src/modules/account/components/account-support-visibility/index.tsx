"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

export default function AccountSupportVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname?.replace(/\/$/, "").endsWith("/hesabim/favorilerim")) return null
  return <>{children}</>
}
