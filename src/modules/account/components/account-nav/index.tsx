"use client"

import { useParams, usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signout } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import {
  Home,
  UserCheck,
  User,
  MapPin,
  ShoppingBag,
  Heart,
  LogOut,
  MessageSquare,
} from "@lib/icons"

const AccountNav = ({
  customer,
  logoUrl,
}: {
  customer: HttpTypes.StoreCustomer | null
  logoUrl: string
}) => {
  const pathname = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  const navItems = [
    {
      label: "Hesabım",
      href: "/hesabim",
      icon: Home,
      exact: true,
    },
    {
      label: "Genel Bakış",
      href: "/hesabim",
      icon: UserCheck,
      exact: true,
    },
    {
      label: "Profil",
      href: "/hesabim/profil",
      icon: User,
      exact: false,
    },
    {
      label: "Adreslerim",
      href: "/hesabim/adreslerim",
      icon: MapPin,
      exact: false,
    },
    {
      label: "Siparişlerim",
      href: "/hesabim/siparislerim",
      icon: ShoppingBag,
      exact: false,
    },
    {
      label: "Favorilerim",
      href: "/hesabim/favorilerim",
      icon: Heart,
      exact: false,
    },
    {
      label: "Mesajlarım",
      href: "/hesabim/mesajlarim",
      icon: MessageSquare,
      exact: false,
    },
  ]

  const isLinkActive = (item: typeof navItems[0]) => {
    const cleanPath = pathname.replace(`/${countryCode}`, "")
    if (item.exact) {
      return cleanPath === item.href || cleanPath === `${item.href}/`
    }
    return cleanPath.startsWith(item.href)
  }

  return (
    <aside className="w-full rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
      {/* Storefront brand mark */}
      <div className="mb-6 pb-6 border-b border-slate-100">
        <LocalizedClientLink href="/" aria-label="ZK Home ana sayfa" className="flex h-12 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]">
          <img src={logoUrl} alt="ZK Home" width={220} height={44} className="max-h-11 max-w-[205px] object-contain" />
        </LocalizedClientLink>
      </div>

      {/* Navigation Menu Links */}
      <nav className="space-y-1.5" aria-label="Hesap navigasyonu">
        {navItems.map((item, idx) => {
          const Icon = item.icon
          const active = isLinkActive(item)

          // Deduplicate if Hesabım and Genel Bakış point to same url for visually pristine menu
          if (idx === 1) return null

          return (
            <LocalizedClientLink
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? "bg-rose-50/90 text-[#C98484] shadow-2xs font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  active ? "text-[#C98484]" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span>{item.label}</span>
            </LocalizedClientLink>
          )
        })}

        {/* Logout Button */}
        <div className="pt-2 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all text-left group"
          >
            <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}

export default AccountNav
