"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronDown, ChevronRight } from "@lib/icons"

type MenuItemProps = {
  icon: ReactNode; label: string; active?: boolean; collapsed: boolean;
  badge?: number; href?: string; onClick?: () => void;
  expanded?: boolean; controls?: string; disabled?: boolean; danger?: boolean;
}

export function AdminSidebarItem({ icon, label, active, collapsed, badge = 0, href, onClick, expanded, controls, disabled, danger }: MenuItemProps) {
  const content = <>
    <span className="admin-nav-icon" aria-hidden="true">{icon}</span>
    {!collapsed && <span className="admin-nav-label">{label}</span>}
    {badge > 0 && <span className="admin-nav-badge" aria-label={`${badge} yeni bildirim`}>{badge > 99 ? "99+" : badge}</span>}
    {!collapsed && expanded !== undefined && <span className="admin-nav-chevron" aria-hidden="true">{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>}
  </>
  const className = `admin-nav-btn${collapsed ? " admin-nav-btn--collapsed" : ""}${danger ? " admin-nav-btn--danger" : ""}`
  return href ? <Link href={href} className={className} aria-current={active ? "page" : undefined} aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined}>{content}</Link>
    : <button type="button" className={className} onClick={onClick} disabled={disabled} aria-current={active ? "page" : undefined} aria-expanded={expanded} aria-controls={controls} aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined}>{content}</button>
}

export function AdminSidebarGroup({ id, icon, label, active, collapsed, expanded, onToggle, items, pathname }: {
  id: string; icon: ReactNode; label: string; active: boolean; collapsed: boolean;
  expanded: boolean; onToggle: () => void; items: readonly { href: string; label: string }[]; pathname: string;
}) {
  // The longest matching route selects only one child, including product detail pages.
  const selected = items.filter(item => pathname === item.href || pathname.startsWith(`${item.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]?.href
  return <div className="admin-nav-group">
    <AdminSidebarItem icon={icon} label={label} active={active} collapsed={collapsed} expanded={!collapsed && expanded} onClick={onToggle} controls={expanded && !collapsed ? id : undefined} />
    {expanded && !collapsed && <div id={id} className="admin-nav-submenu">{items.map(item => <Link key={item.href} href={item.href} className="admin-sub-link" aria-current={selected === item.href ? "page" : undefined}>{item.label}</Link>)}</div>}
  </div>
}
