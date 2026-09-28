"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { SellerQuestionButton } from "@components/common/SellerQuestion"
import Image from "@components/common/SmartImage"
import { usePathname, useRouter } from "next/navigation"
import { AppIcon, ChevronDown, ChevronRight, Building2, Headphones, FileText } from "@lib/icons"
import type { MobileSettings } from "@lib/content/mobile-settings"

interface CategoryItem {
  id: string
  name: string
  handle: string
  url: string
  icon?: string
  children?: CategoryItem[]
}

interface MenuItem {
  label: string
  url: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

export default function MobileSiteChrome({ settings, logoUrl }: { settings: MobileSettings; logoUrl: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [cartCount, setCartCount] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Dynamic menus loaded from Admin database
  const [kurumsal, setKurumsal] = useState<MenuSection>({
    title: "KURUMSAL",
    items: [
      { label: "Hakkımızda", url: "/hakkimizda" },
      { label: "Toptan ve Kurumsal Satış", url: "/toptan-ve-kurumsal-satis" },
      { label: "Markalarımız", url: "/magaza" },
      { label: "Ürün Rehberi ve Makaleler", url: "/blog" },
    ],
  })
  const [musteri, setMusteri] = useState<MenuSection>({
    title: "MÜŞTERİ HİZMETLERİ",
    items: [
      { label: "İletişim", url: "/iletisim" },
      { label: "Sık Sorulan Sorular", url: "/sss" },
      { label: "Teslimat, İptal ve İade", url: "/teslimat-ve-iade" },
      { label: "Garanti ve Teknik Servis", url: "/garanti-ve-teknik-servis" },
      { label: "Sipariş Takibi", url: "/siparis-takibi" },
    ],
  })
  const [yasal, setYasal] = useState<MenuSection>({
    title: "YASAL BİLGİLENDİRME",
    items: [
      { label: "Ön Bilgilendirme Formu", url: "/on-bilgilendirme-formu" },
      { label: "Mesafeli Satış Sözleşmesi", url: "/mesafeli-satis-sozlesmesi" },
      { label: "KVKK Aydınlatma Metni", url: "/kvkk" },
      { label: "Gizlilik Politikası", url: "/gizlilik-politikasi" },
      { label: "Çerez Politikası", url: "/cerez-politikasi" },
    ],
  })
  const [supportPhone, setSupportPhone] = useState("0850 303 00 47")

  // Collapsible accordion states in drawer
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    kurumsal: true,
    musteri: true,
    yasal: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const fetchCartCount = () => {
    fetch(`/api/cart/count?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => {
        if (typeof data?.count === "number") {
          setCartCount(data.count)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchCartCount()
    const handleCartUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent<{ count?: number }>
      if (typeof customEvent?.detail?.count === "number") {
        setCartCount(customEvent.detail.count)
      } else {
        fetchCartCount()
      }
    }
    window.addEventListener("cart_updated", handleCartUpdate)
    window.addEventListener("focus", handleCartUpdate)
    return () => {
      window.removeEventListener("cart_updated", handleCartUpdate)
      window.removeEventListener("focus", handleCartUpdate)
    }
  }, [pathname])

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [searchOpen])

  // Close search bar & menu on route change
  useEffect(() => {
    setSearchOpen(false)
    setMenuOpen(false)
  }, [pathname])

  // Dynamic navigation fetch when drawer opens
  useEffect(() => {
    if (!menuOpen || categoriesLoaded) return
    let cancelled = false
    fetch("/api/catalog/navigation")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: any) => {
        if (cancelled) return
        const catList: CategoryItem[] = []
        const mapCategory = (cat: any): CategoryItem => ({
            id: cat.id,
            name: cat.name || cat.title || cat.handle,
            handle: cat.handle || cat.id,
            url: cat.metadata?.pretty_url === true ? `/${cat.handle}` : `/kategoriler/${cat.handle}`,
            icon: cat.metadata?.card_image_url || cat.metadata?.icon || cat.icon || "",
            children: (cat.category_children || []).map(mapCategory),
          })
        for (const cat of data?.categories || []) {
          catList.push(mapCategory(cat))
        }
        if ((data?.collections || []).some((brand: any) => brand.metadata?.active !== false)) {
          catList.push({ id: "brands", name: "Markalar", handle: "markalar", url: "/markalar", icon: "/category-icons/markalar.svg" })
        }
        setCategories(catList)
        if (data?.kurumsal) setKurumsal(data.kurumsal)
        if (data?.musteri) setMusteri(data.musteri)
        if (data?.yasal) setYasal(data.yasal)
        if (data?.supportPhone) setSupportPhone(data.supportPhone)
        setCategoriesLoaded(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [menuOpen, categoriesLoaded])

  if (!settings.enabled) return null

  const renderCategoryItems = (items: CategoryItem[], depth = 0): React.ReactNode =>
    items.map((cat) => {
      const hasChildren = Boolean(cat.children?.length)
      const key = `category-${cat.id}`
      const expanded = Boolean(openSections[key])
      return <div key={cat.id} className={depth ? "ml-4 border-l border-slate-100 pl-2" : ""}>
        <div className="flex items-center gap-1">
          <Link href={cat.url} onClick={() => setMenuOpen(false)}
            className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[11.5px] font-bold text-slate-800 hover:bg-rose-50 hover:text-[#C98484]">
            {depth === 0 && <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100/80">
              <AppIcon name={cat.icon || "Tag"} className="h-3.5 w-3.5 object-contain" />
            </span>}
            <span className="truncate">{cat.name}</span>
          </Link>
          {hasChildren && <button type="button" aria-label={`${cat.name} alt kategorilerini ${expanded ? "kapat" : "aç"}`}
            aria-expanded={expanded} onClick={() => toggleSection(key)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-[#C98484]">
            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>}
        </div>
        {hasChildren && expanded && renderCategoryItems(cat.children || [], depth + 1)}
      </div>
    })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      router.push(`/magaza?q=${encodeURIComponent(query)}`)
      setSearchOpen(false)
    }
  }

  const drawerMenuGroups = [
    {
      key: "kurumsal",
      title: kurumsal.title,
      icon: Building2,
      items: kurumsal.items,
    },
    {
      key: "musteri",
      title: musteri.title,
      icon: Headphones,
      items: musteri.items,
    },
    {
      key: "yasal",
      title: yasal.title,
      icon: FileText,
      items: yasal.items,
    },
  ]

  return (
    <>
      {/* Mobile Top Header Chrome */}
      <div className="mobile-only-chrome md:hidden sticky top-0 z-[90]">
        {settings.announcementText && (
          <Link
            href={settings.announcementHref || "/"}
            className="block bg-[#C98484] px-4 py-2 text-center text-[10px] font-extrabold tracking-wide text-white"
          >
            {settings.announcementText}
          </Link>
        )}
        <header className="flex h-[56px] items-center justify-between border-b border-slate-100 bg-white px-3 shadow-xs">
          {/* Hamburger Menu Toggle Button (ALWAYS ON LEFT) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Kategoriler ve Menü Aç"
            className="grid h-10 w-10 place-items-center rounded-full text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
          >
            <AppIcon name="Menu" className="h-5 w-5" />
          </button>

          {/* Logo (Consistent h-8 w-32 size across all mobile screens) */}
          <Link href="/" className="relative h-8 w-32 shrink-0 flex items-center justify-center">
            <Image
              src={logoUrl}
              alt="ZK Home"
              width={128}
              height={32}
              priority
              className="h-full w-full object-contain"
            />
          </Link>

          {/* Top Right Actions: Search & Sepet */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Arama Aç"
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors cursor-pointer ${
                searchOpen ? "bg-rose-50 text-[#C98484]" : "text-slate-800 hover:bg-slate-100"
              }`}
            >
              <AppIcon name="Search" className="h-5 w-5" />
            </button>
            <Link
              href="/sepet"
              aria-label="Sepetim"
              className="relative grid h-10 w-10 place-items-center text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            >
              <AppIcon name="ShoppingCart" className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C98484] px-1 text-[9px] font-black text-white shadow-xs">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Collapsible Functional Mobile Search Bar */}
        {searchOpen && (
          <div className="bg-white px-3 py-2.5 border-b border-slate-200 shadow-md animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <AppIcon name="Search" className="absolute left-3.5 h-4 w-4 text-[#C98484] pointer-events-none" />
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={settings.searchPlaceholder || "Ürün, kategori veya model ara"}
                className="w-full h-11 bg-slate-100 border border-slate-200 rounded-2xl pl-10 pr-9 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#C98484] focus:bg-white focus:ring-2 focus:ring-[#C98484]/20 transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Aramayı temizle"
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  <AppIcon name="X" className="h-4 w-4" />
                </button>
              ) : null}
            </form>
          </div>
        )}
      </div>

      {/* Slide-in Mobile Drawer Navigation Menu */}
      {menuOpen && (
        <div className="md:hidden">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Side Drawer Content */}
          <div className="fixed inset-y-0 left-0 z-[101] flex w-[85%] max-w-[340px] flex-col bg-white shadow-2xl transition-transform duration-300 animate-in slide-in-from-left">
            {/* Drawer Header */}
            <div className="flex h-[56px] items-center justify-between border-b border-slate-100 bg-slate-50 px-3.5">
              <Link href="/" onClick={() => setMenuOpen(false)} className="relative h-7 w-28 flex items-center justify-center">
                <Image
                  src={logoUrl}
                  alt="ZK Home"
                  width={112}
                  height={28}
                  className="h-full w-full object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <AppIcon name="X" className="h-4 w-4" />
              </button>
            </div>

            {/* Quick User Banner */}
            <div className="bg-gradient-to-r from-[#C98484] to-rose-600 px-3.5 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-xs">
                  <AppIcon name="User" className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black">ZK Home'ya Hoş Geldiniz</h3>
                  <p className="text-[10px] font-semibold text-rose-100">Kaliteli Alet & Donanım Mağazası</p>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <Link
                  href="/hesabim"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/15 py-1.5 text-[11px] font-bold text-white hover:bg-white/25 transition-colors"
                >
                  <AppIcon name="User" className="h-3 w-3" /> Hesabım
                </Link>
                <Link
                  href="/favorilerim"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/15 py-1.5 text-[11px] font-bold text-white hover:bg-white/25 transition-colors"
                >
                  <AppIcon name="Heart" className="h-3 w-3" /> Favorilerim
                </Link>
              </div>
            </div>

            {/* Drawer Body - Scrollable Content with Compact Spacing */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Product Categories Section */}
              <div>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                    Ürün Kategorileri
                  </span>
                  <Link
                    href="/magaza"
                    onClick={() => setMenuOpen(false)}
                    className="text-[10.5px] font-bold text-[#C98484] hover:underline"
                  >
                    Tüm Mağaza
                  </Link>
                </div>

                <div className="space-y-0.5">
                  {renderCategoryItems(categories)}
                </div>
              </div>

              {/* 3 Main Dynamic Admin Categories (Kurumsal, Müşteri Hizmetleri, Yasal Bilgilendirme) */}
              {drawerMenuGroups.map((group) => {
                const isOpen = !!openSections[group.key]
                const Icon = group.icon

                return (
                  <div key={group.key} className="border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleSection(group.key)}
                      className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-50 focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-50 text-[#C98484]">
                          <Icon className="h-3 w-3" />
                        </span>
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-700">
                          {group.title}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#C98484]" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="mt-1 space-y-0.5 pl-6 pr-1 animate-in fade-in duration-150">
                        {group.items.map((item, idx) => (
                          <Link
                            key={idx}
                            href={item.url || "#"}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-between rounded-md px-2 py-1 text-[11.5px] font-medium text-slate-600 hover:bg-rose-50/80 hover:text-[#C98484] transition-colors group"
                          >
                            <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                            <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-[#C98484] transition-colors shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-3.5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Müşteri Destek</p>
                  <p className="text-xs font-black text-slate-900">{supportPhone}</p>
                </div>
                <SellerQuestionButton
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-[#C98484] px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-[#A95E5E] transition-colors"
                >
                  Satıcıya Sor
                </SellerQuestionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-[80] grid h-[68px] w-full max-w-full grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        {settings.bottomNavigation
          .filter((item) => item.active)
          .slice(0, 5)
          .map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const isCart =
              item.href === "/sepet" ||
              item.icon === "ShoppingCart" ||
              item.id === "cart" ||
              item.id === "nav-cart" ||
              item.icon?.toLowerCase().includes("cart") ||
              item.label?.toLowerCase().includes("sepet")

            return (
              <Link
                key={item.id}
                href={item.href || "/"}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[9px] font-bold ${
                  active ? "text-[#C98484]" : "text-slate-500"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <AppIcon name={item.icon} className="h-5 w-5" />
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C98484] px-1 text-[9px] font-black text-white shadow-xs">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            )
          })}
      </nav>
    </>
  )
}
