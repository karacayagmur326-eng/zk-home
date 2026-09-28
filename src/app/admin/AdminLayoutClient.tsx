"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, type CSSProperties } from "react"
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  CircleAlert,
  CircleCheck,
  Info,
  X,
  AppIcon,
} from "@lib/icons"
import ClearCacheButton from "./components/ClearCacheButton"
import MaintenanceToggleButton from "./components/MaintenanceToggleButton"
import "./admin-design-system.css"

// ─── Nav definitions ────────────────────────────────────────────────────────
const marketingSubItems = [
  { href: "/admin/indirimler", label: "İndirimler & Kuponlar" },
  { href: "/admin/pazarlama/kampanyalar", label: "Kampanyalar" },
  { href: "/admin/pazarlama/sadakat", label: "Sadakat Programı" },
]

const mainNavItems = [
  {
    href: "/admin/siparisler",
    label: "Siparişler",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
  {
    href: "/admin/iadeler",
    label: "İade Talepleri",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12a9 9 0 1 0 3-6.7"></path>
        <path d="M3 3v6h6"></path>
      </svg>
    ),
  },
  {
    href: "/admin/kullanicilar",
    label: "Kullanıcılar",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
  {
    href: "/admin/slaytlar",
    label: "Sliderlar",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    ),
  },
  {
    href: "/admin/mobil",
    label: "Mobil",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="20" rx="2"></rect>
        <path d="M10 18h4"></path>
      </svg>
    ),
  },
  {
    href: "/admin/anasayfa-vitrini",
    label: "Ana Sayfa Vitrini",
    icon: <AppIcon name="PanelsTopLeft" size={18} />,
  },
  {
    href: "/admin/menuler",
    label: "Menüler",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    ),
  },
  {
    href: "/admin/sayfalar",
    label: "Sayfalar",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16v16H4z"></path>
        <path d="M8 8h8M8 12h8M8 16h5"></path>
      </svg>
    ),
  },
  {
    href: "/admin/blog",
    label: "Blog & Makaleler",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
  },
  {
    href: "/admin/medya",
    label: "Medya",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
  },
  {
    href: "/admin/iletisim",
    label: "İletişim & Mesajlar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
  },
  {
    href: "/admin/chatbot",
    label: "ZK Home Asistan",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="13" rx="2"></rect>
        <path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"></path>
      </svg>
    ),
  },

  {
    href: "/admin/ayarlar",
    label: "Ayarlar",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    ),
  },
]

const productSubItems = [
  { href: "/admin/urunler", label: "Tüm Ürünler" },
  { href: "/admin/urunler/yeni", label: "Yeni Ürün Ekle" },
  { href: "/admin/urunler/ice-aktar", label: "Excel'den İçe Aktar" },
  { href: "/admin/urunler/markalar", label: "Markalar" },
  { href: "/admin/kategoriler", label: "Kategoriler" },
  { href: "/admin/urunler/etiketler", label: "Etiketler" },
  { href: "/admin/urunler/nitelikler", label: "Özellikler" },
  { href: "/admin/urunler/degerlendirmeler", label: "Değerlendirmeler" },
]

const navIconNames: Record<string, string> = {
  "/admin/siparisler": "ClipboardList",
  "/admin/iadeler": "RotateCcw",
  "/admin/kullanicilar": "UsersRound",
  "/admin/slaytlar": "GalleryHorizontalEnd",
  "/admin/anasayfa-vitrini": "PanelsTopLeft",
  "/admin/mobil": "Smartphone",
  "/admin/menuler": "ListTree",
  "/admin/sayfalar": "Files",
  "/admin/blog": "BookOpen",
  "/admin/medya": "Images",
  "/admin/iletisim": "MessagesSquare",
  "/admin/chatbot": "ZK Home Asistan",
  "/admin/ayarlar": "Settings",
}

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  sidebar: "#111820",
  sidebarHover: "#1d2834",
  sidebarBorder: "#273341",
  sidebarText: "#aeb8c5",
  sidebarActive: "#C98484",
  content: "#f5f7fa",
  white: "#ffffff",
  heading: "#172033",
  text: "#344054",
  muted: "#697386",
  border: "#e2e7ee",
  rowHover: "#f6f7f7",
  primary: "#C98484",
  primaryHover: "#d94f00",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const isProductsActive =
    pathname === "/admin/urunler" ||
    pathname.startsWith("/admin/urunler/") ||
    pathname.startsWith("/admin/kategoriler")

  const isMarketingActive =
    pathname === "/admin/indirimler" ||
    pathname.startsWith("/admin/pazarlama")

  const [prodOpen, setProdOpen] = useState(isProductsActive)
  const [mktOpen, setMktOpen] = useState(isMarketingActive)
  const [loggingOut, setLoggingOut] = useState(false)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [userRole, setUserRole] = useState<string>("Admin")
  const [themeSettings, setThemeSettings] = useState<any>(null)
  const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({})
  const [toastNotification, setToastNotification] = useState<{
    id: number
    message: string
    title: string
    type: "success" | "error" | "info"
  } | null>(null)

  useEffect(() => {
    fetch("/api/admin/auth/check")
      .then((response) => response.json())
      .then((data) => {
        setAuthenticated(Boolean(data.authenticated))
        if (data.role) {
          setUserRole(data.role)

          if (data.role === "Editör") {
            const allowed = [
              "/admin/urunler",
              "/admin/kategoriler",
              "/admin/slaytlar",
              "/admin/anasayfa-vitrini",
              "/admin/menuler",
              "/admin/sayfalar",
              "/admin/medya",
              "/admin/iletisim",
              "/admin/chatbot",
            ]
            const currentPath = window.location.pathname
            const isOk = allowed.some((prefix) => currentPath === prefix || currentPath.startsWith(prefix + "/"))
            if (!isOk) {
              window.location.href = "/admin/urunler"
            }
          } else if (data.role === "Yönetici") {
            const forbidden = [
              "/admin/kullanicilar",
              "/admin/ayarlar",
              "/admin/magaza-ayarlari",
              "/admin/entegrasyonlar",
              "/admin/tema-ayarlari"
            ]
            const currentPath = window.location.pathname
            const isForbidden = forbidden.some((prefix) => currentPath === prefix || currentPath.startsWith(prefix + "/"))
            if (isForbidden) {
              window.location.href = "/admin/siparisler"
            }
          }
        }
        if (!data.authenticated && window.location.pathname !== "/admin") {
          window.location.href = "/admin"
        }
      })
      .catch(() => setAuthenticated(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!authenticated) return
    fetch("/api/admin/theme-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setThemeSettings(d.settings)
      })
      .catch(() => {})
  }, [authenticated])

  useEffect(() => {
    if (!authenticated) return
    let alive = true
    const refresh = () => {
      fetch("/api/admin/notifications/summary", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (alive && data.counts) setNotificationCounts(data.counts)
        })
        .catch(() => {})
    }
    refresh()
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener("admin-notifications:refresh", refresh)
    return () => {
      alive = false
      window.clearInterval(timer)
      window.removeEventListener("admin-notifications:refresh", refresh)
    }
  }, [authenticated])

  useEffect(() => {
    if (!authenticated) return
    const category = pathname.startsWith("/admin/siparisler")
      ? "orders"
      : pathname.startsWith("/admin/iadeler")
      ? "returns"
      : pathname.startsWith("/admin/kullanicilar")
      ? "customers"
      : ""
    if (!category) return
    fetch("/api/admin/notifications/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category }),
    }).then(() => {
      setNotificationCounts((current) => ({ ...current, [category]: 0 }))
    }).catch(() => {})
  }, [authenticated, pathname])

  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).showAdminAlert = (
        message: string,
        title = "Bilgi",
        type: "success" | "error" | "info" = "success",
      ) => {
        setToastNotification({ id: Date.now(), message, title, type })
      }
    }
  }, [])

  useEffect(() => {
    if (!toastNotification) return
    const timer = setTimeout(() => {
      setToastNotification(null)
    }, 3200)
    return () => clearTimeout(timer)
  }, [toastNotification])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/admin/auth/logout", { method: "POST" })
    router.push("/admin")
    window.location.reload()
  }

  if (authenticated === null)
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Yönetim paneli yükleniyor...</div>
  if (!authenticated) return <>{children}</>

  // Page title and subtitle from current route
  const pageSubtitles: Record<string, string> = {
    "/admin": "Mağazanızın genel performansını ve son gelişmeleri buradan takip edebilirsiniz.",
    "/admin/siparisler": "Tüm müşteri siparişlerini yönetin, durumlarını güncelleyin ve kargo takibi yapın.",
    "/admin/iadeler": "Müşterilerden gelen iade taleplerini inceleyin ve yönetin.",
    "/admin/kullanicilar": "Kullanıcı ve yönetim ekibi hesaplarını yönetin.",
    "/admin/slaytlar": "Ana sayfa slider görsellerini ve duyuru bantlarını yönetin.",
    "/admin/anasayfa-vitrini": "Koleksiyon, seçki, banner, oda ve bülten alanlarını yönetin.",
    "/admin/menuler": "Mağaza üst ve alt menü yapısını düzenleyin.",
    "/admin/sayfalar": "Kurumsal sayfaları (Gizlilik, KVKK, vb.) düzenleyin ve yönetin.",
    "/admin/medya": "Yüklenen tüm görsel ve medya dosyalarını yönetin.",
    "/admin/iletisim": "Gelen form mesajlarını yönetin, sayfa metinlerini düzenleyin ve SMTP bildirim izinlerini ayarlayın.",
    "/admin/chatbot": "ZK Home Asistan yanıtlarını ve WhatsApp iletişim kanalını tek merkezden yönetin.",
    "/admin/ayarlar": "Mağaza kuralları, tema tasarımı, entegrasyonlar (İyzico, BirFatura) ve SEO ayarlarını tek merkezden yönetin.",
    "/admin/magaza-ayarlari": "Kargo, ödeme, vergi, fatura ve sipariş kurallarını yönetin.",
    "/admin/entegrasyonlar": "Ödeme, kargo ve pazaryeri entegrasyonlarını yönetin.",
    "/admin/tema-ayarlari": "Mağazanızın renk, logo ve görünüm ayarlarını düzenleyin.",
    "/admin/urunler": "Tüm ürün kataloğunu inceleyin, fiyat ve stok güncelleyin.",
    "/admin/urunler/yeni": "Mağazanıza yeni bir ürün ekleyin.",
    "/admin/urunler/ice-aktar": "Excel dosyanızı yükleyerek tüm katalog verilerini anında güncelleyin.",
    "/admin/urunler/markalar": "Markaları ekleyin, düzenleyin ve mağazanızda yönetin.",
    "/admin/kategoriler": "Ürün kategorilerini ve hiyerarşisini düzenleyin.",
    "/admin/urunler/etiketler": "Ürün etiketlerini yönetin.",
    "/admin/urunler/nitelikler": "Ürün özelliklerini ve varyasyon seçeneklerini yönetin.",
    "/admin/urunler/degerlendirmeler": "Müşteri ürün değerlendirmelerini ve yorumlarını inceleyin.",
    "/admin/indirimler": "İndirim kuponları ve promosyon kampanyalarını yönetin.",
    "/admin/pazarlama/kampanyalar": "Pazarlama kampanyalarını ve özel fırsatları yönetin.",
    "/admin/pazarlama/sadakat": "Müşteri puan ve sadakat sistemini yönetin.",
  }

  const pageTitle = (() => {
    if (pathname === "/admin") return "Ana Sayfa"
    const all = [...productSubItems, ...marketingSubItems, ...mainNavItems]
    // 1. Exact match first
    const exact = all.find((n) => n.href === pathname)
    if (exact) return exact.label
    // 2. Longest prefix match if dynamic subpage
    const matches = all.filter((n) => pathname.startsWith(n.href + "/"))
    if (matches.length > 0) {
      matches.sort((a, b) => b.href.length - a.href.length)
      return matches[0].label
    }
    return "Admin"
  })()

  const pageSubtitle = pageSubtitles[pathname] || ""

  const W = collapsed ? 64 : 248

  return (
    <div
      className="admin-shell"
      style={{
        "--admin-sidebar-width": `${W}px`,
        display: "flex",
        minHeight: "100vh",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 13,
      } as CSSProperties}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`admin-sidebar${mobileNavOpen ? " admin-sidebar--mobile-open" : ""}`}
        style={{
          width: W,
          minWidth: W,
          maxWidth: W,
          backgroundColor: C.sidebar,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          height: "100vh",
          transition: "width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease",
          overflow: "hidden",
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Mağazayı yeni sekmede aç"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            padding: collapsed ? "12px 8px" : "16px 16px",
            borderBottom: `1px solid ${C.sidebarBorder}`,
            minHeight: 56,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          {collapsed ? (
            themeSettings?.mini_logo_url ? (
              <img
                src={themeSettings.mini_logo_url}
                alt="Mini Logo"
                style={{
                  height: `${themeSettings.mini_logo_height || 36}px`,
                  width: `${themeSettings.mini_logo_height || 36}px`,
                  objectFit: "contain",
                  borderRadius: 4,
                }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: "linear-gradient(135deg,#C98484,#ff8c42)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
            )
          ) : (
            <img
              src={
                themeSettings?.admin_logo_url || themeSettings?.header_logo_url || "/brand/zkhome-logo-dark.svg"
              }
              alt={themeSettings?.logo_text ? `${themeSettings.logo_text} Admin Logo` : "Admin Logo"}
              style={{
                height: `${themeSettings?.admin_logo_height || 40}px`,
                maxWidth: "180px",
                objectFit: "contain",
              }}
            />
          )}
        </Link>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {/* Dashboard (Hidden for Editör) */}
          {userRole !== "Editör" && (
            <NavItem
              href="/admin"
              icon={<AppIcon name="LayoutDashboard" size={18} />}
              label="Ana Sayfa"
              active={pathname === "/admin"}
              collapsed={collapsed}
            />
          )}

          {/* Ürünler collapsible */}
          <div>
            <button
              onClick={() => setProdOpen((o) => !o)}
              aria-current={isProductsActive ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 10,
                padding: collapsed ? "9px 14px" : "9px 16px",
                border: "none",
                background: isProductsActive ? C.sidebarHover : "transparent",
                color: isProductsActive ? "#fff" : C.sidebarText,
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                borderLeft: isProductsActive
                  ? `3px solid ${C.sidebarActive}`
                  : "3px solid transparent",
                transition: "all 0.15s",
              }}
              className="admin-nav-btn"
            >
              <span
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  marginRight: 2,
                }}
              >
                <AppIcon name="PackageOpen" size={18} />
              </span>
              {!collapsed && (
                <>
                  <span
                    style={{
                      flex: 1,
                      fontWeight: isProductsActive ? 600 : 400,
                    }}
                  >
                    Ürünler
                  </span>
                  {prodOpen ? (
                    <ChevronDown aria-hidden="true" size={15} />
                  ) : (
                    <ChevronRight aria-hidden="true" size={15} />
                  )}
                </>
              )}
            </button>

            {prodOpen && !collapsed && (
              <div style={{ backgroundColor: "#161b1f" }}>
                {productSubItems.map((sub) => {
                  const active =
                    pathname === sub.href ||
                    (sub.href !== "/admin/urunler" &&
                      pathname.startsWith(sub.href))
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      style={{
                        display: "block",
                        padding: "7px 16px 7px 42px",
                        textDecoration: "none",
                        fontSize: 12,
                        color: active ? "#fff" : "#8a9099",
                        fontWeight: active ? 600 : 400,
                        background: active
                          ? "rgba(201,132,132,0.15)"
                          : "transparent",
                        borderLeft: active
                          ? `3px solid ${C.sidebarActive}`
                          : "3px solid transparent",
                        transition: "all 0.12s",
                      }}
                      className="admin-sub-link"
                    >
                      {sub.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pazarlama collapsible (Hidden for Editör) */}
          {userRole !== "Editör" && (
            <div>
            <button
              onClick={() => setMktOpen((o) => !o)}
              aria-current={isMarketingActive ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: 10,
                  padding: collapsed ? "9px 14px" : "9px 16px",
                  border: "none",
                  background: isMarketingActive ? C.sidebarHover : "transparent",
                  color: isMarketingActive ? "#fff" : C.sidebarText,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  borderLeft: isMarketingActive
                    ? `3px solid ${C.sidebarActive}`
                    : "3px solid transparent",
                  transition: "all 0.15s",
                }}
                className="admin-nav-btn"
              >
                <span
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    marginRight: 2,
                  }}
                >
                  <AppIcon name="BadgePercent" size={18} />
                </span>
                {!collapsed && (
                  <>
                    <span
                      style={{
                        flex: 1,
                        fontWeight: isMarketingActive ? 600 : 400,
                      }}
                    >
                      Pazarlama
                    </span>
                    {mktOpen ? (
                      <ChevronDown aria-hidden="true" size={15} />
                    ) : (
                      <ChevronRight aria-hidden="true" size={15} />
                    )}
                  </>
                )}
              </button>

              {mktOpen && !collapsed && (
                <div style={{ backgroundColor: "#161b1f" }}>
                  {marketingSubItems.map((sub) => {
                    const active =
                      pathname === sub.href ||
                      (sub.href !== "/admin/indirimler" &&
                        pathname.startsWith(sub.href))
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        style={{
                          display: "block",
                          padding: "7px 16px 7px 42px",
                          textDecoration: "none",
                          fontSize: 12,
                          color: active ? "#fff" : "#8a9099",
                          fontWeight: active ? 600 : 400,
                          background: active
                            ? "rgba(201,132,132,0.15)"
                            : "transparent",
                          borderLeft: active
                            ? `3px solid ${C.sidebarActive}`
                            : "3px solid transparent",
                          transition: "all 0.12s",
                        }}
                        className="admin-sub-link"
                      >
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Main nav items (Filtered by Role) */}
          {mainNavItems
            .filter((item) => {
              if (userRole === "Editör") {
                return [
                  "/admin/slaytlar",
                  "/admin/anasayfa-vitrini",
                  "/admin/menuler",
                  "/admin/sayfalar",
                  "/admin/medya",
                  "/admin/iletisim",
                  "/admin/chatbot",
                ].includes(item.href)
              }
              if (userRole === "Yönetici") {
                return ![
                  "/admin/kullanicilar",
                  "/admin/ayarlar",
                ].includes(item.href)
              }
              return true
            })
            .map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={<AppIcon name={navIconNames[item.href]} size={18} />}
                  label={item.label}
                  active={active}
                  collapsed={collapsed}
                  badge={
                    item.href === "/admin/iletisim"
                      ? notificationCounts.contacts
                      : item.href === "/admin/siparisler"
                      ? notificationCounts.orders
                      : item.href === "/admin/iadeler"
                      ? notificationCounts.returns
                      : item.href === "/admin/kullanicilar"
                      ? notificationCounts.customers
                      : 0
                  }
                />
              )
            })}
        </nav>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid ${C.sidebarBorder}`,
            padding: "8px 0",
          }}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: collapsed ? "9px 14px" : "9px 16px",
              border: "none",
              background: "transparent",
              color: C.sidebarText,
              cursor: "pointer",
              fontSize: 13,
            }}
            className="admin-nav-btn admin-sidebar-collapse"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" size={17} />
            ) : (
              <PanelLeftClose aria-hidden="true" size={17} />
            )}
            {!collapsed && <span>Küçült</span>}
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: collapsed ? "9px 14px" : "9px 16px",
              border: "none",
              background: "transparent",
              color: "#f87171",
              cursor: "pointer",
              fontSize: 13,
            }}
            className="admin-nav-btn"
          >
            <LogOut aria-hidden="true" size={17} />
            {!collapsed && <span>{loggingOut ? "Çıkılıyor..." : "Çıkış"}</span>}
          </button>
        </div>
      </aside>

      <button
        type="button"
        className={`admin-mobile-backdrop${mobileNavOpen ? " admin-mobile-backdrop--visible" : ""}`}
        aria-label="Yönetim menüsünü kapat"
        onClick={() => setMobileNavOpen(false)}
      />

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div
        className="admin-workspace"
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: W,
          display: "flex",
          flexDirection: "column",
          background: C.white,
          transition: "margin-left 0.2s ease",
        }}
      >
        {/* Yönetim durumu çubuğu */}
        <div
          className="admin-statusbar"
          style={{
            minHeight: 42,
            background: "#111820",
            color: "#f8fafc",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            borderBottom: "1px solid #273341",
          }}
        >
          <span style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
            {themeSettings?.logo_text ? `${themeSettings.logo_text} Yönetim Paneli` : "Yönetim Paneli"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="admin-role-badge">
              <ShieldCheck aria-hidden="true" size={15} />
              <span className="admin-role-badge__label">Yetki</span>
              <span>{userRole}</span>
            </span>
          </div>
        </div>
        <header
          className="admin-page-header"
          style={{
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            padding: "0 28px",
            minHeight: 62,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          }}
        >
          <div className="admin-page-heading">
            <button
              type="button"
              className="admin-mobile-menu-button"
              aria-label="Yönetim menüsünü aç"
              aria-expanded={mobileNavOpen}
              onClick={() => {
                setCollapsed(false)
                setMobileNavOpen(true)
              }}
            >
              <AppIcon name="Menu" size={18} />
            </button>
            <div className="admin-page-heading__text">
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 750,
                color: C.heading,
                lineHeight: 1.2,
              }}
            >
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", fontWeight: 500, lineHeight: 1.4 }}>
                {pageSubtitle}
              </p>
            )}
            </div>
          </div>
          <div className="admin-page-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="admin-role-badge admin-role-badge--light">
              <ShieldCheck aria-hidden="true" size={15} />
              <span>{userRole}</span>
            </span>
            <MaintenanceToggleButton />
            <ClearCacheButton variant="header" />
          </div>
        </header>

        {/* Page */}
        <main className="admin-content" style={{ flex: 1, padding: "24px 28px 40px" }}>
          {children}
        </main>
      </div>

      {/* Non-blocking Floating Toast Notification (Auto-disappears in 3s) */}
      {toastNotification && (
        <div className={`admin-toast admin-toast--${toastNotification.type}`} role="status" aria-live="polite">
          <div className="admin-toast__icon">
            {toastNotification.type === "error" ? (
              <CircleAlert aria-hidden="true" size={17} />
            ) : toastNotification.type === "info" ? (
              <Info aria-hidden="true" size={17} />
            ) : (
              <CircleCheck aria-hidden="true" size={17} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#172033", marginBottom: 2 }}>
              {toastNotification.title || (toastNotification.type === "error" ? "Hata" : "Başarılı")}
            </div>
            <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.45 }}>
              {toastNotification.message}
            </div>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="admin-icon-button !h-7 !min-h-7 !w-7"
            aria-label="Bildirimi kapat"
          >
            <X aria-hidden="true" size={14} />
          </button>
        </div>
      )}

      {/* Global admin styles */}
      <style>{`
        @keyframes adminModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes adminModalZoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .admin-nav-btn:hover { background-color: ${C.sidebarHover} !important; color: #fff !important; }
        .admin-sub-link:hover { background-color: rgba(255,255,255,0.05) !important; color: #fff !important; }
        
      `}</style>
    </div>
  )
}

// ── Reusable NavItem ──────────────────────────────────────────────────────────
function NavItem({
  href,
  icon,
  label,
  active,
  collapsed,
  badge = 0,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  collapsed: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "9px 14px" : "9px 16px",
        textDecoration: "none",
        color: active ? "#fff" : "#a7aaad",
        background: active ? "#2c3338" : "transparent",
        fontWeight: active ? 600 : 400,
        borderLeft: active ? "3px solid #C98484" : "3px solid transparent",
        transition: "all 0.12s",
        fontSize: 13,
      }}
      className="admin-nav-btn"
    >
      <span
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
        }}
      >
        {icon}
      </span>
      {!collapsed && <span style={{ whiteSpace: "nowrap", flex: 1 }}>{label}</span>}
      {badge > 0 && (
        <span
          aria-label={`${badge} yeni bildirim`}
          style={{
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#ff6b18,#ef3f3f)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            boxShadow: "0 4px 12px rgba(239,63,63,.32)",
            marginLeft: collapsed ? -8 : "auto",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  )
}
