import { NextResponse } from "next/server"
import { listCategories } from "@lib/data/categories"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getMenu } from "@lib/data/menus"

export const revalidate = 60

export async function GET() {
  ensureCommerceSchema().catch(() => null)
  const [categories, collections, kurumsalMenu, musteriMenu, yasalMenu, sidebarMenu, themeSettings] = await Promise.all([
    listCategories().catch(() => []),
    query(`SELECT id,title,handle,metadata FROM store_collection ORDER BY title`).catch(() => []),
    getMenu("footer-kurumsal").catch(() => null),
    getMenu("footer-musteri-hizmetleri").catch(() => null),
    getMenu("footer-yasal").catch(() => null),
    getMenu("category-sidebar").catch(() => null).then(async (m) => m || await getMenu("ikincil-menu").catch(() => null)),
    query<Record<string, unknown>>("SELECT * FROM theme_settings WHERE id = 1")
      .then((r) => r[0] || null)
      .catch(() => null),
  ])

  const kurumsalItems = kurumsalMenu?.items?.length
    ? kurumsalMenu.items
    : [
        { label: "Hakkımızda", url: "/hakkimizda" },
        { label: "Kurumsal Hediyeler", url: "/toptan-ve-kurumsal-satis" },
        { label: "Markalarımız", url: "/magaza" },
        { label: "Ürün Rehberi ve Makaleler", url: "/blog" },
      ]

  const rawMusteriItems = musteriMenu?.items?.length
    ? musteriMenu.items
    : [
        { label: "İletişim", url: "/iletisim" },
        { label: "Sık Sorulan Sorular", url: "/sss" },
        { label: "Teslimat, İptal ve İade", url: "/teslimat-ve-iade" },
        { label: "Sipariş Takibi", url: "/siparis-takibi" },
      ]
  const musteriItems = rawMusteriItems.filter((item: any) => item.url !== "/garanti-ve-teknik-servis" && item.label !== "Garanti ve Teknik Servis" && item.id !== "fm4")

  const yasalItems = yasalMenu?.items?.length
    ? yasalMenu.items
    : [
        { label: "Ön Bilgilendirme Formu", url: "/on-bilgilendirme-formu" },
        { label: "Mesafeli Satış Sözleşmesi", url: "/mesafeli-satis-sozlesmesi" },
        { label: "KVKK Aydınlatma Metni", url: "/kvkk" },
        { label: "Gizlilik Politikası", url: "/gizlilik-politikasi" },
        { label: "Çerez Politikası", url: "/cerez-politikasi" },
      ]

  return NextResponse.json(
    {
      categories,
      collections,
      kurumsal: {
        title: (themeSettings?.footer_col2_title as string) || "KURUMSAL",
        items: kurumsalItems.map((item: any) => item.url === "/toptan-ve-kurumsal-satis" ? { ...item, label: "Kurumsal Hediyeler" } : item),
      },
      musteri: {
        title: (themeSettings?.footer_col3_title as string) || "MÜŞTERİ HİZMETLERİ",
        items: musteriItems,
      },
      yasal: {
        title: (themeSettings?.footer_col4_title as string) || "YASAL BİLGİLENDİRME",
        items: yasalItems,
      },
      sidebarMenu,
      supportPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }
  )
}
