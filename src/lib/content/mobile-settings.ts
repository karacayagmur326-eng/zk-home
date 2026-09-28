import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { cache } from "react"
import { normalizePublicImageUrl } from "@lib/security/public-assets"
import { persistInlineImageUrl } from "@lib/storage/persist-inline-image"

export type MobileLinkItem = {
  id: string
  label: string
  subtitle?: string
  icon: string
  image?: string
  href: string
  active: boolean
}

export type MobileSlide = {
  id: string
  badge: string
  title: string
  description: string
  buttonLabel: string
  buttonHref: string
  image: string
  active: boolean
  sortOrder: number
}

export type MobileSection = {
  id: string
  title: string
  linkLabel: string
  linkHref: string
  source: "latest" | "featured" | "bestseller"
  active: boolean
}

export type MobileSettings = {
  enabled: boolean
  logoUrl: string
  searchPlaceholder: string
  announcementText: string
  announcementHref: string
  slides: MobileSlide[]
  shortcuts: MobileLinkItem[]
  homeSections: MobileSection[]
  bottomNavigation: MobileLinkItem[]
  favorites: {
    title: string
    description: string
    tabs: string[]
    emptyTitle: string
    emptyDescription: string
    emptyButtonLabel: string
    emptyButtonHref: string
  }
  history: {
    title: string
    description: string
    noticeTitle: string
    noticeDescription: string
    filters: string[]
  }
  collections: {
    title: string
    description: string
    bannerTitle: string
    bannerDescription: string
    buttonLabel: string
    emptyTitle: string
    emptyDescription: string
  }
  account: {
    title: string
    description: string
    noticeTitle: string
    noticeDescription: string
    menuItems: MobileLinkItem[]
  }
  cart: {
    title: string
    freeShippingTitle: string
    freeShippingDescription: string
    checkoutLabel: string
    emptyTitle: string
    emptyDescription: string
    emptyButtonLabel: string
    emptyButtonHref: string
  }
}

const item = (id: string, label: string, icon: string, href: string, subtitle = ""): MobileLinkItem => ({
  id,
  label,
  subtitle,
  icon,
  href,
  active: true,
})

export const defaultMobileSettings: MobileSettings = {
  enabled: true,
  logoUrl: "/brand/zkhome-logo.svg",
  searchPlaceholder: "Ürün, kategori veya model ara",
  announcementText: "ZK Home yakında hizmetinizde",
  announcementHref: "/magaza",
  slides: [
    {
      id: "mobile-slide-1",
      badge: "ZK HOME",
      title: "Yeni mağazamız hazırlanıyor.",
      description: "Ürünler ve içerikler yönetim panelinden eklenecektir.",
      buttonLabel: "Mağazaya Git",
      buttonHref: "/magaza",
      image: "",
      active: true,
      sortOrder: 1,
    },
  ],
  shortcuts: [
    item("shortcut-1", "Yeni Ürünler", "Sparkles", "/magaza"),
    item("shortcut-2", "Kategoriler", "LayoutGrid", "/magaza"),
    item("shortcut-3", "Favoriler", "Heart", "/hesabim/favorilerim"),
    item("shortcut-4", "Hesabım", "UserRound", "/hesabim"),
  ],
  homeSections: [
    { id: "home-1", title: "Sana Özel Ürünler", linkLabel: "Tümünü Gör", linkHref: "/magaza", source: "featured", active: true },
    { id: "home-2", title: "Çok Satanlar", linkLabel: "Tümünü Gör", linkHref: "/magaza", source: "bestseller", active: true },
    { id: "home-3", title: "Kampanyalı Ürünler", linkLabel: "Tümünü Gör", linkHref: "/magaza", source: "latest", active: true },
  ],
  bottomNavigation: [
    item("nav-home", "Ana Sayfa", "House", "/"),
    item("nav-categories", "Kategoriler", "LayoutGrid", "/magaza"),
    item("nav-favorites", "Favoriler", "Heart", "/hesabim/favorilerim"),
    item("nav-cart", "Sepetim", "ShoppingCart", "/sepet"),
    item("nav-account", "Hesabım", "UserRound", "/hesabim"),
  ],
  favorites: {
    title: "Favorilerim",
    description: "Beğendiğiniz ürünleri kaydedin.",
    tabs: ["Tümü", "Fiyatı Düşenler", "Stoktakiler"],
    emptyTitle: "Favori listeniz boş",
    emptyDescription: "Beğendiğiniz ürünleri kalp simgesine dokunarak buraya ekleyebilirsiniz.",
    emptyButtonLabel: "Ürünleri Keşfet",
    emptyButtonHref: "/magaza",
  },
  history: {
    title: "Son Gezilenler",
    description: "İncelediğiniz ürünlere kaldığınız yerden devam edin.",
    noticeTitle: "Gezinme geçmişi açık",
    noticeDescription: "Dilediğiniz zaman bu cihazdaki geçmişi temizleyebilirsiniz.",
    filters: ["Tümü", "Fiyatı Düşenler", "Stoktakiler"],
  },
  collections: {
    title: "Koleksiyonlarım",
    description: "Projeleriniz için ürünleri gruplandırın ve kolayca bulun.",
    bannerTitle: "Yeni bir proje mi var?",
    bannerDescription: "Ürünlerinizi tek koleksiyonda toplayın.",
    buttonLabel: "Koleksiyon Oluştur",
    emptyTitle: "Henüz koleksiyon yok",
    emptyDescription: "Favori ürünlerinizi proje veya kullanım alanına göre gruplandırabilirsiniz.",
  },
  account: {
    title: "Hesabım",
    description: "Sipariş ve hesap işlemlerinizi yönetin.",
    noticeTitle: "Siparişlerinizi kolayca takip edin",
    noticeDescription: "Güncel kargo ve teslimat bilgilerinize ulaşın.",
    menuItems: [
      item("account-orders", "Siparişlerim", "PackageCheck", "/hesabim/siparislerim"),
      item("account-service", "Servis Taleplerim", "Wrench", "/garanti-ve-teknik-servis"),
      item("account-favorites", "Favorilerim", "Heart", "/hesabim/favorilerim"),
      item("account-history", "Son Gezilenler", "History", "/son-gezdiklerim"),
      item("account-collections", "Koleksiyonlarım", "FolderHeart", "/koleksiyonlarim"),
      item("account-addresses", "Adreslerim", "MapPin", "/hesabim/adreslerim"),
      item("account-messages", "Mesajlarım", "MessageCircle", "/iletisim"),
      item("account-faq", "Sık Sorulanlar", "CircleHelp", "/sss"),
    ],
  },
  cart: {
    title: "Sepetim",
    freeShippingTitle: "Kargo avantajınızı kontrol edin",
    freeShippingDescription: "Ücretsiz kargo eşiği sepet tutarınıza göre otomatik hesaplanır.",
    checkoutLabel: "Sepeti Onayla",
    emptyTitle: "Sepetiniz boş",
    emptyDescription: "İhtiyacınız olan profesyonel ürünleri keşfetmeye başlayın.",
    emptyButtonLabel: "Alışverişe Başla",
    emptyButtonHref: "/magaza",
  },
}

const mergeHomeSections = (stored?: MobileSection[]): MobileSection[] => {
  if (!Array.isArray(stored) || stored.length === 0) {
    return defaultMobileSettings.homeSections
  }
  const hasKampanya = stored.some(
    (s) => s.id === "home-3" || s.title.toLowerCase().includes("kampanya")
  )
  if (!hasKampanya) {
    return [
      ...stored,
      { id: "home-3", title: "Kampanyalı Ürünler", linkLabel: "Tümünü Gör", linkHref: "/magaza", source: "latest", active: true },
    ]
  }
  return stored
}

const merge = (stored: Partial<MobileSettings>): MobileSettings => ({
  ...defaultMobileSettings,
  ...stored,
  favorites: { ...defaultMobileSettings.favorites, ...(stored.favorites || {}) },
  history: { ...defaultMobileSettings.history, ...(stored.history || {}) },
  collections: { ...defaultMobileSettings.collections, ...(stored.collections || {}) },
  account: { ...defaultMobileSettings.account, ...(stored.account || {}) },
  cart: { ...defaultMobileSettings.cart, ...(stored.cart || {}) },
  slides: (Array.isArray(stored.slides) ? stored.slides : defaultMobileSettings.slides).map((slide) => ({
    ...slide,
    image: normalizePublicImageUrl(
      slide.image,
      slide.title?.toLocaleLowerCase("tr-TR").includes("jet")
        ? "/uploads/slider-temiz-acik-1920x700.png"
        : defaultMobileSettings.slides[0].image
    ),
  })),
  shortcuts: Array.isArray(stored.shortcuts) ? stored.shortcuts : defaultMobileSettings.shortcuts,
  homeSections: mergeHomeSections(stored.homeSections),
  bottomNavigation: Array.isArray(stored.bottomNavigation) ? stored.bottomNavigation : defaultMobileSettings.bottomNavigation,
})

export const getMobileSettings = cache(async (): Promise<MobileSettings> => {
  try {
    await ensureCommerceSchema()
    const rows = await query<{ value: Partial<MobileSettings> }>(
      "SELECT value FROM store_setting WHERE key='mobile_experience' LIMIT 1",
    )
    return merge(rows[0]?.value || {})
  } catch (error) {
    console.error("Mobil mağaza ayarları yüklenemedi:", error)
    return defaultMobileSettings
  }
})

export async function saveMobileSettings(value: MobileSettings) {
  await ensureCommerceSchema()
  const persistLinkImages = async (items: MobileLinkItem[] | undefined) =>
    Promise.all((items || []).map(async (entry) => ({
      ...entry,
      image: await persistInlineImageUrl(entry.image, entry.label) as string | undefined,
    })))

  const persisted: MobileSettings = {
    ...value,
    logoUrl: await persistInlineImageUrl(value.logoUrl, "mobil logo") as string,
    slides: await Promise.all((value.slides || []).map(async (slide) => ({
      ...slide,
      image: await persistInlineImageUrl(slide.image, slide.title || "mobil slider") as string,
    }))),
    shortcuts: await persistLinkImages(value.shortcuts),
    bottomNavigation: await persistLinkImages(value.bottomNavigation),
    account: {
      ...value.account,
      menuItems: await persistLinkImages(value.account?.menuItems),
    },
  }
  const normalized = merge(persisted)
  await query(
    `INSERT INTO store_setting (key,value) VALUES ('mobile_experience',$1)
     ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,
    [normalized]
  )
  return normalized
}
