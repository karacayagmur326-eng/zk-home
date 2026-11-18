"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { User } from "@lib/icons"
import { useStorefrontSession } from "../storefront-session"
import CustomerNotifications from "../customer-notifications"

export default function HeaderAccount({ notifications = false }: { notifications?: boolean }) {
  const { customer } = useStorefrontSession()
  if (notifications) return customer ? <CustomerNotifications key={customer.id} customerId={customer.id} /> : null
  const label = customer?.role === "Admin" ? "Admin" : customer?.first_name
  return label ? <LocalizedClientLink href="/hesabim" data-testid="nav-account-link" aria-label={`Hesabım (${label})`} title={`Hesabım: ${label}`}
    className="flex items-center gap-1.5 pl-1 pr-2.5 h-8 xl:h-9 rounded-full bg-[#C98484] text-white shadow-sm hover:bg-[#A95E5E]">
    <span className="flex h-6 w-6 xl:h-7 xl:w-7 items-center justify-center rounded-full bg-white/20 font-extrabold text-[11px]">{label.charAt(0).toUpperCase()}</span>
    <span className="text-xs font-extrabold max-w-[90px] truncate hidden 2xl:inline">{label}</span>
  </LocalizedClientLink> : <LocalizedClientLink href="/hesabim" data-testid="nav-account-link" aria-label="Giriş Yap / Hesabım" title="Giriş Yap / Hesabım"
    className="flex h-9 w-9 xl:h-10 xl:w-10 items-center justify-center rounded-circle text-muted hover:bg-subtle hover:text-primary">
    <User aria-hidden="true" className="w-4 h-4 xl:w-[21px] xl:h-[21px]" />
  </LocalizedClientLink>
}
