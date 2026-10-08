"use client"
import AdminTabs from "@components/admin/AdminTabs"

import { useUrlState } from "@lib/hooks/use-url-state"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Headphones, Phone, Mail, MapPin, Clock, MessageCircle, ShieldCheck, Save, ArrowLeft, Image as ImageIcon, Sparkles, Award, Target, Eye, BarChart3, HelpCircle, Building2, MessageSquare, FileText, RotateCcw, Pencil, Copy, Trash2, Search } from "lucide-react"
import ImagePickerField from "../components/ImagePickerField"
import LinkPickerSelect from "../components/LinkPickerSelect"
import RichTextEditorField from "../components/RichTextEditorField"
import IconPickerModal from "../components/IconPickerModal"
import ServicePageEditor from "./ServicePageEditor"
import StructuredPageEditor from "./StructuredPageEditor"
import KnowledgePageEditor from "./KnowledgePageEditor"
import { AppIcon } from "@lib/icons"

function IconPickerField({
  label,
  value,
  onOpenPicker
}: {
  label?: string
  value: string
  onOpenPicker: () => void
}) {
  return (
    <div>
      {label && <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>}
      <div className="flex gap-1.5 items-center">
        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
          <AppIcon name={value || "box"} className="w-4 h-4 text-[#C98484]" />
        </div>
        <button
          type="button"
          onClick={onOpenPicker}
          className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 transition flex items-center justify-between gap-1 shadow-2xs cursor-pointer truncate"
        >
          <span className="truncate">{value ? `İkon: ${value}` : "İkon Seç"}</span>
          <span className="text-[10px] text-[#C98484] bg-[#C98484]/10 px-1.5 py-0.5 rounded font-extrabold shrink-0">Seç 🎨</span>
        </button>
      </div>
    </div>
  )
}

type PageContent = Record<string, any>
type Page = { handle: string; content: PageContent; deleted_at?: string }

const names: Record<string, string> = {
  hakkimizda: "Hakkımızda",
  iletisim: "İletişim",
  "teslimat-ve-iade": "Teslimat, İptal ve İade Koşulları",
  "toptan-ve-kurumsal-satis": "Toptan ve Kurumsal Satış",
  markalar: "Markalarımız",
  "garanti-ve-teknik-servis": "Garanti ve Teknik Servis",
}

function slugify(text: string): string {
  if (!text) return ""
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function AdminPages() {
  return (
    <Suspense fallback={<div className="admin-panel">Sayfalar yükleniyor...</div>}>
      <AdminPagesContent />
    </Suspense>
  )
}

function AdminPagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editing = searchParams.get("duzenle")
  const isNewPage = editing === "yeni"
  const isContactPage = editing === "iletisim"
  const isAboutPage = editing === "hakkimizda"
  const isDeliveryPage = editing === "teslimat-ve-iade"
  const isWholesalePage = editing === "toptan-ve-kurumsal-satis" || editing === "toptan-satis"
  const isBrandsPage = editing === "markalar" || editing === "markalarimiz"
  const isServicePage = editing === "garanti-ve-teknik-servis"
  const isStructuredPage = !!editing && ["siparis-takibi", "on-bilgilendirme-formu", "mesafeli-satis-sozlesmesi", "kvkk-aydinlatma-metni", "gizlilik-politikasi", "cerez-politikasi"].includes(editing)
  const isKnowledgePage = editing === "sss"

  const [pages, setPages] = useState<Page[]>([])
  const [deletedPages, setDeletedPages] = useState<Page[]>([])
  const [selected, setSelected] = useState("hakkimizda")

  // Table & List State
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useUrlState<"all" | "published" | "draft" | "deleted">("all", "tab", ["all", "published", "draft", "deleted"])
  const [selectedHandles, setSelectedHandles] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState("bulk")

  const [brandsInfo, setBrandsInfo] = useState({
    title: "Markalarımız",
    description: "Kalite ve güvenilirliğini kanıtlamış, alanında lider markaların ürünlerini sizlere sunuyoruz. En iyi markalar, en uygun fiyatlarla burada.",
    hero_image: "/brand/placeholder.svg",
    hero_cta_text: "Teklif Talebi Oluştur",
    hero_cta_href: "/toptan-ve-kurumsal-satis",
    secondary_cta_text: "Bize Ulaşın",
    secondary_cta_href: "/iletisim",
    feat1_title: "Güvenilir Markalar", feat1_desc: "Kalitesi ve başarısı kanıtlanmış dünya markaları.", feat1_icon: "award",
    feat2_title: "Orijinal Ürün Garantisi", feat2_desc: "Tüm ürünler %100 orijinal ve garantilidir.", feat2_icon: "shield-check",
    feat3_title: "Uygun Fiyat Avantajı", feat3_desc: "En iyi markaları en avantajlı fiyatlarla sunuyoruz.", feat3_icon: "tag",
    feat4_title: "Uzman Destek", feat4_desc: "Doğru ürün seçimi için uzman ekibimiz yanınızda.", feat4_icon: "headphones",
    main_title: "Ana Markalarımız",
    main_cta_text: "Tüm Markaları Görüntüle",
    main_cta_href: "/magaza",
    cta_title: "Size Özel Marka ve Ürün Çözümleri",
    cta_desc: "İhtiyacınıza uygun marka, ürün ve fiyat teklifleri için uzman ekibimizle iletişime geçin.",
    cta_btn1_text: "Teklif Talebi Oluştur",
    cta_btn1_href: "/toptan-ve-kurumsal-satis",
    cta_btn2_text: "Bize Ulaşın",
    cta_btn2_href: "/iletisim",
  })

  const [wholesaleInfo, setWholesaleInfo] = useState({
    show_contact_form: true,
    eyebrow: "Kurumsal",
    title: "İşinizi Güçlendiren Profesyonel Çözümler",
    description: "İşletmelerin ve atölyelerin ihtiyaç duyduğu yüksek kaliteli ürünleri toptan avantajlarla sunuyoruz. Güvenilir ürünler, rekabetçi fiyatlar ve özel hizmet anlayışıyla iş ortağınız olmaya hazırız.",
    hero_image: "/brand/placeholder.svg",
    hero_cta1_text: "Teklif Talebi Oluştur",
    hero_cta1_href: "#quote-form",
    hero_cta2_text: "Bize Ulaşın",
    hero_cta2_href: "/iletisim",

    feat1_title: "Toptan Fiyat Avantajı", feat1_desc: "Yüksek adetli alımlarda özel fiyatlandırma fırsatları.", feat1_icon: "tag",
    feat2_title: "Güvenilir Tedarik", feat2_desc: "Stoktan hızlı teslimat ve kesintisiz tedarik.", feat2_icon: "package",
    feat3_title: "Uzman Destek", feat3_desc: "İhtiyacınıza uygun ürün ve çözüm önerileri.", feat3_icon: "headphones",
    feat4_title: "Özel Çözümler", feat4_desc: "Projenize özel ürün, paketleme ve lojistik çözümleri.", feat4_icon: "wrench",
    feat5_title: "Fatura ve Ödeme", feat5_desc: "Kolay fatura yönetimi ve esnek ödeme seçenekleri.", feat5_icon: "receipt",

    why_title: "Neden Bizi Seçmelisiniz?",
    why_desc: "Yılların deneyimi ve geniş ürün yelpazemizle, farklı sektörlerdeki işletmelerin üretim gücünü artırıyoruz. Kaliteyi uygun fiyatla buluşturuyor, işinizi büyütmenize katkı sağlıyoruz.",
    stat1_value: "10.000+", stat1_label: "Ürün Çeşidi", stat1_icon: "tag",
    stat2_value: "500+", stat2_label: "Kurumsal Müşteri", stat2_icon: "users",
    stat3_value: "Hızlı", stat3_label: "Teslimat", stat3_icon: "truck",
    stat4_value: "%100", stat4_label: "Müşteri Memnuniyeti", stat4_icon: "award",

    target_title: "Kimler İçin Uygun?",
    target_item1: "Sanayi ve üretim tesisleri",
    target_item2: "İnşaat ve taahhüt firmaları",
    target_item3: "Otomotiv servis ve yedek parça bayileri",
    target_item4: "Perakende satış yapan işletmeler",
    target_item5: "Kamu kurum ve kuruluşları",
    target_item6: "Özel atölyeler ve teknik servisler",

    process_title: "Toptan Satış Sürecimiz",
    step1_title: "Talep", step1_desc: "İhtiyacınızı ve istediğiniz ürünleri bize iletin.", step1_icon: "file-text",
    step2_title: "Teklif", step2_desc: "Size özel fiyat ve teslimat teklifimizi sunalım.", step2_icon: "receipt",
    step3_title: "Sipariş", step3_desc: "Teklifinizi onaylayın, siparişinizi oluşturalım.", step3_icon: "package-check",
    step4_title: "Teslimat", step4_desc: "Ürünlerinizi hızlı ve güvenli şekilde teslim edelim.", step4_icon: "truck",
    step5_title: "Destek", step5_desc: "Satış sonrası destekte yanınızda olalım.", step5_icon: "shield-check",
    step6_title: "Memnuniyet", step6_desc: "Kesintisiz iş ortaklığı ve müşteri memnuniyeti takibi.", step6_icon: "award",

    form_title: "Size Özel Teklif Alın",
    form_desc: "İhtiyacınızı belirtin, en kısa sürede size geri dönüş yapalım.",
    phone: "",
    phone_sub: "Hafta içi 09:00 - 18:00",
    email: "",
    email_sub: "Ortalama yanıt süresi: 2 saat",
    address: "",
  })
  const [saving, setSaving] = useState(false)
  const [slugEditing, setSlugEditing] = useState(false)
  const [customSlug, setCustomSlug] = useState("")
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [siteOrigin, setSiteOrigin] = useState("")
  const [iconPickerState, setIconPickerState] = useState<{
    isOpen: boolean
    onSelect: (icon: string) => void
  }>({
    isOpen: false,
    onSelect: () => {},
  })

  const openIconPicker = (onSelectCallback: (icon: string) => void) => {
    setIconPickerState({
      isOpen: true,
      onSelect: onSelectCallback,
    })
  }

  const closeIconPicker = () => {
    setIconPickerState((prev) => ({ ...prev, isOpen: false }))
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
    }
  }, [])

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/admin/site-pages")
      const data = await res.json()
      if (data.pages) {
        setPages(data.pages)
      }
      setDeletedPages(data.deleted_pages || [])
    } catch {}
  }

  const handleDeletePages = async (handlesToDelete: string[]) => {
    if (handlesToDelete.length === 0) return
    if (!confirm(`${handlesToDelete.length} adet sayfayı Silinen Sayfalar bölümüne taşımak istediğinizden emin misiniz?`)) return

    try {
      const res = await fetch("/api/admin/site-pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: handlesToDelete }),
      })
      const data = await res.json()
      if (data.success) {
        ;(window as any).showAdminAlert?.("Seçilen sayfalar çöp kutusuna taşındı.", "Başarılı", "success")
        setSelectedHandles([])
        fetchPages()
      } else {
        ;(window as any).showAdminAlert?.(data.error || "Silme işlemi başarısız.", "Hata", "error")
      }
    } catch {
      ;(window as any).showAdminAlert?.("Silme işlemi başarısız.", "Hata", "error")
    }
  }

  const handleRestorePages = async (handlesToRestore: string[]) => {
    if (handlesToRestore.length === 0) return
    try {
      const res = await fetch("/api/admin/site-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", handles: handlesToRestore }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Geri yükleme başarısız.")
      ;(window as any).showAdminAlert?.("Seçilen sayfalar geri yüklendi.", "Başarılı", "success")
      setSelectedHandles([])
      await fetchPages()
    } catch (error: any) {
      ;(window as any).showAdminAlert?.(error.message || "Geri yükleme başarısız.", "Hata", "error")
    }
  }

  const handlePermanentDeletePages = async (handlesToDelete: string[]) => {
    if (handlesToDelete.length === 0) return
    if (!confirm("Bu işlem geri alınamaz. Seçilen sayfaları kalıcı olarak silmek istiyor musunuz?")) return
    try {
      const res = await fetch("/api/admin/site-pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: handlesToDelete, permanent: true }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Kalıcı silme başarısız.")
      ;(window as any).showAdminAlert?.("Seçilen sayfalar kalıcı olarak silindi.", "Başarılı", "success")
      setSelectedHandles([])
      await fetchPages()
    } catch (error: any) {
      ;(window as any).showAdminAlert?.(error.message || "Kalıcı silme başarısız.", "Hata", "error")
    }
  }

  const handleDuplicatePage = async (handleToDup: string) => {
    try {
      const res = await fetch("/api/admin/site-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", handle: handleToDup }),
      })
      const data = await res.json()
      if (data.success) {
        ;(window as any).showAdminAlert?.("Sayfa kopyası başarıyla oluşturuldu.", "Başarılı", "success")
        fetchPages()
      } else {
        ;(window as any).showAdminAlert?.(data.error || "Kopyalama başarısız.", "Hata", "error")
      }
    } catch {
      ;(window as any).showAdminAlert?.("Kopyalama başarısız.", "Hata", "error")
    }
  }

  const handleApplyBulkAction = async () => {
    if (selectedHandles.length === 0) {
      ;(window as any).showAdminAlert?.("Lütfen en az bir sayfa seçin.", "Hata", "warning")
      return
    }
    if (bulkAction === "restore") {
      await handleRestorePages(selectedHandles)
    } else if (bulkAction === "permanent-delete") {
      await handlePermanentDeletePages(selectedHandles)
    } else if (bulkAction === "delete") {
      await handleDeletePages(selectedHandles)
    } else if (bulkAction === "published" || bulkAction === "draft") {
      try {
        for (const h of selectedHandles) {
          const target = pages.find((p) => p.handle === h)
          if (target) {
            await fetch("/api/admin/site-pages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                handle: h,
                content: {
                  ...target.content,
                  status: bulkAction,
                },
              }),
            })
          }
        }
        ;(window as any).showAdminAlert?.("Seçilen sayfaların durumu güncellendi.", "Başarılı", "success")
        setSelectedHandles([])
        fetchPages()
      } catch {
        ;(window as any).showAdminAlert?.("Toplu güncelleme başarısız.", "Hata", "error")
      }
    }
  }

  // Form state for normal pages
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newTags, setNewTags] = useState<string[]>([])
  const [newStatus, setNewStatus] = useState("published")
  const [heroCtaText, setHeroCtaText] = useState("")
  const [heroCtaHref, setHeroCtaHref] = useState("")
  const [heroImage, setHeroImage] = useState("")

  // Contact Page specific fields
  const [contactInfo, setContactInfo] = useState({
    eyebrow: "7/24 Destek Ekibi",
    title: "Bizimle İletişime Geçin",
    description: "Ürünlerimiz, siparişleriniz, teslimat ve iade süreçleri, garanti işlemleri veya toptan satış talepleriniz hakkında destek almak için ilgili iletişim kanalımızdan bize ulaşabilirsiniz.",
    hero_image: "/brand/placeholder.svg",
    hero_cta_text: "",
    hero_cta_href: "",

    card1_title: "Müşteri Hizmetleri",
    card1_desc: "Sipariş durumu, ödeme, kargo, iptal ve iade işlemleri hakkında destek alabilirsiniz.",
    card1_phone: "0850 303 00 47",
    card1_email: "",
    card1_hours: "Hafta içi 09:00 - 18:00",

    card2_title: "Toptan ve Kurumsal Satış",
    card2_desc: "Toplu alım, bayi fiyatlandırması, proje bazlı ürün tedariği ve kurumsal teklif talepleriniz için bize ulaşın.",
    card2_phone: "",
    card2_email: "",
    card2_hours: "Hafta içi 09:00 - 18:00",

    card3_title: "Garanti ve Teknik Servis",
    card3_desc: "Garanti kapsamı, yedek parça, teknik inceleme ve servis süreçleri hakkında bilgi alabilirsiniz.",
    card3_phone: "",
    card3_email: "",
    card3_hours: "Hafta içi 09:00 - 18:00",

    card4_title: "Merkez ve İade Adresi",
    card4_company: "Merkez Ofis",
    card4_address: "",
    card4_country: "Türkiye",
    card4_map_btn: "Haritada Görüntüle",

    company_title: "Firma Bilgileri",
    company_legal_title: "E-Ticaret ve Mağazacılık A.Ş.",
    company_brand: "Mağazamız",
    company_mersis: "",
    company_tax_office: "İstanbul V.D.",
    company_tax_no: "123 456 7890",
    company_trade_reg_no: "",
    company_kep: "",
    company_email: "",
    company_phone: "",
    company_address: "[Şirket adresi yönetim panelinden eklenecektir]",
    company_callout: "Tüm soru ve görüşleriniz için bizlere dilediğiniz zaman ulaşabilirsiniz.",

    visit_title: "Ziyaret Etmek İster misiniz?",
    visit_desc: "Merkez ofisimiz ve depomuzu ziyaret ederek ürünlerimizi yakından inceleyebilirsiniz.",
    map_embed_url: "",

    form_title: "Bize Mesaj Gönderin",
    form_description: "Aşağıdaki formu doldurarak müşteri temsilcilerimize doğrudan mesajınızı iletebilirsiniz.",
    kvkk_url: "/kvkk",
  })

  // Teslimat ve İade Page specific fields
  const [deliveryInfo, setDeliveryInfo] = useState({
    eyebrow: "Müşteri Bilgilendirme",
    title: "Teslimat, İptal ve İade Koşulları",
    description: "Sipariş, teslimat, iptal ve iade süreçlerimizle ilgili tüm detayları burada bulabilirsiniz.",
    hero_image: "/brand/placeholder.svg",
    hero_cta_text: "",
    hero_cta_href: "",
    content_html: `<h3>🚚 Siparişlerin Hazırlanması</h3>
<p>Siparişler, ödeme onayının alınmasının ardından stok ve ürün kontrolleri yapılarak hazırlanmaya başlanır. Stokta bulunan ürünler, aksi belirtilmedikçe <strong class="text-[#C98484] font-bold">1-3 iş günü</strong> içerisinde kargo firmasına teslim edilir.</p>

<h3>📦 Teslimat</h3>
<p>Siparişler, müşterinin sipariş sırasında bildirdiği teslimat adresine gönderilir. Teslimat süresi; teslimat adresine, kargo firmasının operasyonlarına ve bölgesel koşullara göre değişebilir.</p>

<h3>🛡️ Hasarlı Paketler</h3>
<p>Teslimat sırasında pakette yırtılma, ezilme, açılma, ıslanma veya benzeri bir hasar görülmesi halinde ürün kontrol edilmeli ve gerektiğinde kargo görevlisine hasar tespit tutanağı düzenletilmelidir.</p>

<h3>📦 Sipariş İptali</h3>
<p>Henüz kargoya verilmemiş siparişler için müşteri hizmetleri üzerinden iptal talebi oluşturulabilir. Kargoya teslim edilmiş siparişlerde teslimat ve iade prosedürü uygulanır.</p>

<h3>🔄 İade Koşulları</h3>
<p>Ürünlerin iade edilebilmesi için kullanılmamış, orijinal ambalajında, tüm aksesuarları ve belgeleri ile birlikte gönderilmesi gerekmektedir.</p>

<h3>📄 Cayma Hakkı</h3>
<p>Tüketici, ürünü teslim aldığı tarihten itibaren <strong class="text-[#C98484] font-bold">14 gün</strong> içerisinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir.</p>

<h3>📍 İade Adresi</h3>
<p>İade adresi ve kargo bilgileri mağaza açılmadan önce yapılandırılacaktır.</p>`,

    acc1_title: "Siparişlerin Hazırlanması",
    acc1_desc: "Siparişler, ödeme onayının alınmasının ardından stok ve ürün kontrolleri yapılarak hazırlanmaya başlanır. Stokta bulunan ürünler, aksi belirtilmedikçe 1-3 iş günü içerisinde kargo firmasına teslim edilir.",

    acc2_title: "Teslimat",
    acc2_desc: "Siparişler, müşterinin sipariş sırasında bildirdiği teslimat adresine gönderilir. Teslimat süresi; teslimat adresine, kargo firmasının operasyonlarına ve bölgesel koşullara göre değişebilir.",

    acc3_title: "Hasarlı Paketler",
    acc3_desc: "Teslimat sırasında pakette yırtılma, ezilme, açılma, ıslanma veya benzeri bir hasar görülmesi halinde ürün kontrol edilmeli ve gerektiğinde kargo görevlisine hasar tespit tutanağı düzenletilmelidir.",

    acc4_title: "Sipariş İptali",
    acc4_desc: "Henüz kargoya verilmemiş siparişler için müşteri hizmetleri üzerinden iptal talebi oluşturulabilir. Kargoya teslim edilmiş siparişlerde teslimat ve iade prosedürü uygulanır.",

    acc5_title: "İade Koşulları",
    acc5_desc: "Ürünlerin iade edilebilmesi için kullanılmamış, orijinal ambalajında, tüm aksesuarları ve belgeleri ile birlikte gönderilmesi gerekmektedir.",

    acc6_title: "Cayma Hakkı",
    acc6_desc: "Tüketici, ürünü teslim aldığı tarihten itibaren 14 gün içerisinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir.",

    acc7_title: "İade Adresi",
    acc7_address: "",
    acc7_courier: "Anlaşmalı Kargo",
    acc7_code: "123456",

    highlight_title: "Öne Çıkan Bilgiler",
    h1_title: "1-3 İş Günü İçinde Kargoya Teslim", h1_desc: "Stokta olan ürünler için geçerlidir.",
    h2_title: "Ücretsiz Kargo", h2_desc: "Tüm siparişlerinizde ücretsiz kargo.",
    h3_title: "14 Gün İçinde İade", h3_desc: "Koşulsuz iade hakkınız bulunmaktadır.",
    h4_title: "2 Yıl Garanti", h4_desc: "Tüm ürünlerimizde geçerlidir.",
    h5_title: "7/24 Destek", h5_desc: "Her zaman yanınızdayız.",

    process_title: "İade Süreci Nasıl İşler?",
    step1_title: "İade talebinizi oluşturun.", step1_desc: "Hesabınızdan veya müşteri hizmetlerimiz aracılığıyla iade talebinizi bildirin.",
    step2_title: "Ürünü paketleyin.", step2_desc: "Ürünü orijinal ambalajı ve tüm aksesuarları ile birlikte paketleyin.",
    step3_title: "Kargoya teslim edin.", step3_desc: "Anlaşmalı kargomuz ile ücretsiz olarak ürünü tarafımıza gönderin.",
    step4_title: "İade onayı ve ücret iadesi.", step4_desc: "Ürün kontrolü sonrası iadeniz onaylanır ve ücret iadeniz yapılır.",
    process_btn_text: "İade Talebi Oluştur", process_btn_href: "/hesabim/siparislerim"
  })

  // Hakkımızda Page specific fields
  const [aboutInfo, setAboutInfo] = useState({
    title: "Hakkımızda",
    subtitle: "Profesyonel ekipmanlar, güvenilir çözümler.",
    heroText: "Geniş ürün yelpazesi, kaliteli ürünler ve müşteri odaklı hizmet anlayışımızla perakende ve toptan satış yapan güvenilir çözüm ortağınızız.\n\nAmacımız; doğru ürünü, doğru bilgiyle ve güvenilir hizmetle sizlere sunmaktır.",
    heroCtaText: "Toptan ve Kurumsal Satış",
    heroCtaHref: "/iletisim",
    heroImage: "/brand/placeholder.svg",

    whyTitle: "Neden Bizi Seçmelisiniz?",
    why1Title: "Geniş Ürün Seçeneği",
    why1Desc: "Farklı kullanım alanlarına ve bütçelere uygun kaliteli ürünleri tek çatı altında sunuyoruz.",
    why2Title: "Perakende ve Toptan Satış",
    why2Desc: "Bireysel siparişlerden yüksek adetli kurumsal alımlara kadar farklı ihtiyaçlara uygun satış çözümleri geliştiriyoruz.",
    why3Title: "Güvenilir Ürün Bilgilendirmesi",
    why3Desc: "Ürünlerin teknik özelliklerini, kullanım alanlarını ve paket içeriklerini açık ve anlaşılır biçimde sunuyoruz.",
    why4Title: "Satış Sonrası Destek",
    why4Desc: "Sipariş, teslimat, garanti ve teknik servis süreçlerinde müşterilerimizin yanında olmayı önemsiyoruz.",
    why5Title: "Güvenli Alışveriş",
    why5Desc: "Ödeme ve sipariş süreçlerinde güvenli altyapılar kullanarak müşteri bilgilerinin korunmasına önem veriyoruz.",

    missionTitle: "Misyonumuz",
    missionDesc: "Kaliteli ürünleri güvenilir, ulaşılabilir ve kullanıcı odaklı bir alışveriş deneyimiyle müşterilerimize sunmak.",
    visionTitle: "Vizyonumuz",
    visionDesc: "Bireysel kullanıcılar, profesyoneller ve kurumsal işletmeler için sektörün en güvenilir e-ticaret ve tedarik çözüm ortağı olmak.",

    stat1Val: "10.000+", stat1Lbl: "Ürün Çeşidi",
    stat2Val: "15.000+", stat2Lbl: "Mutlu Müşteri",
    stat3Val: "2 Yıl", stat3Lbl: "Garanti Desteği",
    stat4Val: "1-3 İş Günü", stat4Lbl: "Hızlı Teslimat",

    aboutDetailImage: "/brand/placeholder.svg",
    aboutDetailTitle: "Kurumsal Profilimiz",
    aboutDetailText: "Sektördeki deneyimimizi, güçlü tedarik ağımız ve müşteri odaklı hizmet anlayışımızla birleştiriyoruz.\n\nKaliteli markaları, rekabetçi fiyatlarla ve güvenilir hizmetle buluşturarak işinizi kolaylaştırmak için çalışıyoruz.\n\nİşinize ve yaşamınıza değer katacak çözümlerle her zaman yanınızdayız.",
    aboutDetailCtaText: "İletişime Geçin",
    aboutDetailCtaHref: "/iletisim"
  })

  useEffect(() => {
    fetch("/api/admin/site-pages")
      .then((r) => r.json())
      .then((data) => {
        const loadedPages = data.pages || []
        setPages(loadedPages)
        setDeletedPages(data.deleted_pages || [])

        if (editing && editing !== "yeni") {
          const found = loadedPages.find((item: Page) => item.handle === editing || item.content?.custom_slug === editing)
          if (found) {
            setSelected(editing)
            setNewTitle(found.content?.title || names[editing] || editing)
            setNewDescription(found.content?.description || "")
            setNewTags(Array.isArray(found.content?.tags) ? found.content.tags : [])
            setNewStatus(found.content?.status || "published")
            setCustomSlug(found.content?.custom_slug || (found.handle !== editing ? found.handle : editing))
            setHeroCtaText(found.content?.hero_cta_text || "")
            setHeroCtaHref(found.content?.hero_cta_href || "")
            setHeroImage(found.content?.hero_image || "")

            if (editing === "hakkimizda" && found.content) {
              const c = found.content
              const loadedHeroText = c.heroText || [c.heroP1, c.heroP2].filter(Boolean).join("\n\n")
              const loadedAboutDetailText = c.aboutDetailText || [c.aboutDetailP1, c.aboutDetailP2, c.aboutDetailP3].filter(Boolean).join("\n\n")

              setAboutInfo((prev) => ({
                ...prev,
                title: c.title || prev.title,
                subtitle: c.subtitle || prev.subtitle,
                heroText: loadedHeroText || prev.heroText,
                heroCtaText: c.heroCtaText || prev.heroCtaText,
                heroCtaHref: c.heroCtaHref || prev.heroCtaHref,
                heroImage: c.heroImage || prev.heroImage,

                whyTitle: c.whyTitle || prev.whyTitle,
                why1Title: c.whyItems?.[0]?.title || prev.why1Title,
                why1Desc: c.whyItems?.[0]?.desc || prev.why1Desc,
                why2Title: c.whyItems?.[1]?.title || prev.why2Title,
                why2Desc: c.whyItems?.[1]?.desc || prev.why2Desc,
                why3Title: c.whyItems?.[2]?.title || prev.why3Title,
                why3Desc: c.whyItems?.[2]?.desc || prev.why3Desc,
                why4Title: c.whyItems?.[3]?.title || prev.why4Title,
                why4Desc: c.whyItems?.[3]?.desc || prev.why4Desc,
                why5Title: c.whyItems?.[4]?.title || prev.why5Title,
                why5Desc: c.whyItems?.[4]?.desc || prev.why5Desc,

                missionTitle: c.missionTitle || prev.missionTitle,
                missionDesc: c.missionDesc || prev.missionDesc,
                visionTitle: c.visionTitle || prev.visionTitle,
                visionDesc: c.visionDesc || prev.visionDesc,

                stat1Val: c.stats?.[0]?.value || prev.stat1Val,
                stat1Lbl: c.stats?.[0]?.label || prev.stat1Lbl,
                stat2Val: c.stats?.[1]?.value || prev.stat2Val,
                stat2Lbl: c.stats?.[1]?.label || prev.stat2Lbl,
                stat3Val: c.stats?.[2]?.value || prev.stat3Val,
                stat3Lbl: c.stats?.[2]?.label || prev.stat3Lbl,
                stat4Val: c.stats?.[3]?.value || prev.stat4Val,
                stat4Lbl: c.stats?.[3]?.label || prev.stat4Lbl,

                aboutDetailImage: c.aboutDetailImage || prev.aboutDetailImage,
                aboutDetailTitle: c.aboutDetailTitle || prev.aboutDetailTitle,
                aboutDetailText: loadedAboutDetailText || prev.aboutDetailText,
                aboutDetailCtaText: c.aboutDetailCtaText || prev.aboutDetailCtaText,
                aboutDetailCtaHref: c.aboutDetailCtaHref || prev.aboutDetailCtaHref,
              }))
            }
          }
        } else if (editing === "yeni") {
          setSelected("yeni")
          setNewTitle("")
          setNewDescription("")
          setNewTags([])
          setNewStatus("published")
          setCustomSlug("")
          setHeroCtaText("")
          setHeroCtaHref("")
          setHeroImage("")
        }
      })

    if (editing === "iletisim") {
      fetch("/api/admin/contact-settings")
        .then((r) => r.json())
        .then((data) => {
          if (data.contact_info) {
            setContactInfo((prev) => ({
              ...prev,
              ...data.contact_info,
              hero_image: !data.contact_info.hero_image || data.contact_info.hero_image === "/brand/placeholder.svg" ? "/brand/placeholder.svg" : data.contact_info.hero_image,
            }))
            if (data.contact_info.custom_slug) {
              setCustomSlug(data.contact_info.custom_slug)
            }
          }
        })
        .catch(() => {})
    }

    if (editing === "teslimat-ve-iade") {
      fetch("/api/admin/delivery-settings")
        .then((r) => r.json())
        .then((data) => {
          if (data.delivery_returns_info) {
            setDeliveryInfo((prev) => ({
              ...prev,
              ...data.delivery_returns_info,
              hero_image: !data.delivery_returns_info.hero_image || data.delivery_returns_info.hero_image === "/brand/placeholder.svg" ? "/brand/placeholder.svg" : data.delivery_returns_info.hero_image,
            }))
            if (data.delivery_returns_info.custom_slug) {
              setCustomSlug(data.delivery_returns_info.custom_slug)
            }
          }
        })
        .catch(() => {})
    }

    if (editing === "toptan-ve-kurumsal-satis" || editing === "toptan-satis") {
      fetch("/api/admin/wholesale-settings")
        .then((r) => r.json())
        .then((data) => {
          if (data.wholesale_info) {
            setWholesaleInfo((prev) => ({
              ...prev,
              ...data.wholesale_info,
              hero_image: !data.wholesale_info.hero_image || data.wholesale_info.hero_image === "/brand/placeholder.svg" ? "/brand/placeholder.svg" : data.wholesale_info.hero_image,
            }))
            if (data.wholesale_info.custom_slug) {
              setCustomSlug(data.wholesale_info.custom_slug)
            }
          }
        })
        .catch(() => {})
    }

    if (editing === "markalar" || editing === "markalarimiz") {
      fetch("/api/admin/brands-settings")
        .then((r) => r.json())
        .then((data) => {
          if (data.brands_info) {
            setBrandsInfo((prev) => ({
              ...prev,
              ...data.brands_info,
              hero_image: !data.brands_info.hero_image || data.brands_info.hero_image === "/brand/placeholder.svg" ? "/brand/placeholder.svg" : data.brands_info.hero_image,
            }))
            if (data.brands_info.custom_slug) {
              setCustomSlug(data.brands_info.custom_slug)
            }
          }
        })
        .catch(() => {})
    }
  }, [editing])

  const save = async () => {
    setSaving(true)

    if (isBrandsPage) {
      try {
        await fetch("/api/admin/brands-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brands_info: {
              ...brandsInfo,
              custom_slug: customSlug,
            },
          }),
        })

        await fetch("/api/admin/site-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: customSlug || "markalar",
            old_handle: "markalar",
            content: {
              title: brandsInfo.title,
              custom_slug: customSlug,
              description: brandsInfo.description,
              status: newStatus,
            },
          }),
        })

        ;(window as any).showAdminAlert?.("Markalarımız sayfası başarıyla güncellendi.", "Başarılı", "success")
      } catch {
        ;(window as any).showAdminAlert?.("Güncelleme başarısız.", "Hata", "error")
      } finally {
        setSaving(false)
      }
      return
    }

    if (isWholesalePage) {
      try {
        await fetch("/api/admin/wholesale-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wholesale_info: {
              ...wholesaleInfo,
              custom_slug: customSlug,
            },
          }),
        })

        await fetch("/api/admin/site-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: customSlug || "toptan-ve-kurumsal-satis",
            old_handle: "toptan-ve-kurumsal-satis",
            content: {
              title: wholesaleInfo.title,
              custom_slug: customSlug,
              description: wholesaleInfo.description,
              status: newStatus,
            },
          }),
        })

        ;(window as any).showAdminAlert?.("Toptan ve Kurumsal Satış sayfası başarıyla güncellendi.", "Başarılı", "success")
      } catch {
        ;(window as any).showAdminAlert?.("Güncelleme başarısız.", "Hata", "error")
      } finally {
        setSaving(false)
      }
      return
    }

    if (isDeliveryPage) {

      try {
        await fetch("/api/admin/delivery-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            delivery_returns_info: {
              ...deliveryInfo,
              custom_slug: customSlug,
            },
          }),
        })

        await fetch("/api/admin/site-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: customSlug || "teslimat-ve-iade",
            old_handle: "teslimat-ve-iade",
            content: {
              title: deliveryInfo.title,
              custom_slug: customSlug,
              description: deliveryInfo.description,
              status: newStatus,
            },
          }),
        })

        ;(window as any).showAdminAlert?.("Teslimat ve İade sayfası bilgileri başarıyla güncellendi.", "Başarılı", "success")
      } catch {
        ;(window as any).showAdminAlert?.("Güncelleme başarısız.", "Hata", "error")
      } finally {
        setSaving(false)
      }
      return
    }

    if (isContactPage) {
      try {
        await fetch("/api/admin/contact-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contact_info: {
              ...contactInfo,
              custom_slug: customSlug,
            },
          }),
        })

        await fetch("/api/admin/site-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: customSlug || "iletisim",
            old_handle: "iletisim",
            content: {
              title: contactInfo.title,
              custom_slug: customSlug,
              description: contactInfo.description,
              status: newStatus,
            },
          }),
        })

        ;(window as any).showAdminAlert?.("İletişim sayfası bilgileri başarıyla güncellendi.", "Başarılı", "success")
      } catch {
        ;(window as any).showAdminAlert?.("Güncelleme başarısız.", "Hata", "error")
      } finally {
        setSaving(false)
      }
      return
    }

    if (isAboutPage) {
      try {
        const heroPars = aboutInfo.heroText.split("\n").filter(Boolean)
        const aboutPars = aboutInfo.aboutDetailText.split("\n").filter(Boolean)

        const formattedAboutPayload = {
          title: aboutInfo.title,
          subtitle: aboutInfo.subtitle,
          heroText: aboutInfo.heroText,
          heroP1: heroPars[0] || "",
          heroP2: heroPars[1] || "",
          heroCtaText: aboutInfo.heroCtaText,
          heroCtaHref: aboutInfo.heroCtaHref,
          heroImage: aboutInfo.heroImage,

          whyTitle: aboutInfo.whyTitle,
          whyItems: [
            { title: aboutInfo.why1Title, desc: aboutInfo.why1Desc },
            { title: aboutInfo.why2Title, desc: aboutInfo.why2Desc },
            { title: aboutInfo.why3Title, desc: aboutInfo.why3Desc },
            { title: aboutInfo.why4Title, desc: aboutInfo.why4Desc },
            { title: aboutInfo.why5Title, desc: aboutInfo.why5Desc },
          ],

          missionTitle: aboutInfo.missionTitle,
          missionDesc: aboutInfo.missionDesc,
          visionTitle: aboutInfo.visionTitle,
          visionDesc: aboutInfo.visionDesc,

          stats: [
            { value: aboutInfo.stat1Val, label: aboutInfo.stat1Lbl },
            { value: aboutInfo.stat2Val, label: aboutInfo.stat2Lbl },
            { value: aboutInfo.stat3Val, label: aboutInfo.stat3Lbl },
            { value: aboutInfo.stat4Val, label: aboutInfo.stat4Lbl },
          ],

          aboutDetailImage: aboutInfo.aboutDetailImage,
          aboutDetailTitle: aboutInfo.aboutDetailTitle,
          aboutDetailText: aboutInfo.aboutDetailText,
          aboutDetailP1: aboutPars[0] || "",
          aboutDetailP2: aboutPars[1] || "",
          aboutDetailP3: aboutPars[2] || "",
          aboutDetailCtaText: aboutInfo.aboutDetailCtaText,
          aboutDetailCtaHref: aboutInfo.aboutDetailCtaHref,
          status: newStatus,
        }

        const res = await fetch("/api/admin/site-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: customSlug || "hakkimizda",
            old_handle: "hakkimizda",
            content: {
              ...formattedAboutPayload,
              custom_slug: customSlug,
            },
          }),
        })
        const data = await res.json()
        if (data.success) {
          ;(window as any).showAdminAlert?.("Hakkımızda sayfası içeriği başarıyla güncellendi.", "Başarılı", "success")
        } else {
          ;(window as any).showAdminAlert?.(data.error || "Güncelleme başarısız.", "Hata", "error")
        }
      } catch {
        ;(window as any).showAdminAlert?.("Güncelleme başarısız.", "Hata", "error")
      } finally {
        setSaving(false)
      }
      return
    }

    const finalSlug = customSlug || slugify(newTitle)
    if (!finalSlug) {
      ;(window as any).showAdminAlert?.("Lütfen sayfa başlığı veya kalıcı bağlantı girin.", "Hata", "error")
      setSaving(false)
      return
    }

    const handleToSave = finalSlug || selected
    const payload = {
      handle: handleToSave,
      old_handle: selected,
      content: {
        title: newTitle,
        custom_slug: customSlug,
        description: newDescription,
        tags: newTags,
        status: newStatus,
        hero_cta_text: heroCtaText,
        hero_cta_href: heroCtaHref,
        hero_image: heroImage,
      },
    }

    const response = await fetch("/api/admin/site-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    const data = await response.json()
    
    if (data.success) {
      ;(window as any).showAdminAlert?.(
        "Sayfa değişiklikleri başarıyla yayınlandı.",
        "Kaydedildi",
        "success"
      )
      if (isNewPage) {
        router.replace(`/admin/sayfalar?duzenle=${handleToSave}`)
      } else {
        fetchPages()
      }
    } else {
      ;(window as any).showAdminAlert?.(
        data.error || "Kaydetme başarısız.",
        "Hata",
        "error"
      )
    }
  }

  // ── 1. PAGE LIST TABLE ────────────────────────────────────────────────────────
  if (!editing) {
    const publishedCount = pages.filter((p) => (p.content?.status || "published") === "published").length
    const draftCount = pages.filter((p) => p.content?.status === "draft").length

    const sourcePages = activeTab === "deleted" ? deletedPages : pages
    const filteredPages = sourcePages.filter((item) => {
      const title = (item.content?.title || names[item.handle] || item.handle).toLowerCase()
      const handle = item.handle.toLowerCase()
      const slug = (item.content?.custom_slug || "").toLowerCase()
      const q = searchQuery.toLowerCase().trim()

      const matchesSearch = !q || title.includes(q) || handle.includes(q) || slug.includes(q)

      const status = item.content?.status || "published"
      if (activeTab === "published" && status !== "published") return false
      if (activeTab === "draft" && status !== "draft") return false

      return matchesSearch
    })

    const allSelected = filteredPages.length > 0 && filteredPages.every((p) => selectedHandles.includes(p.handle))

    const toggleSelectAll = () => {
      if (allSelected) {
        setSelectedHandles([])
      } else {
        setSelectedHandles(filteredPages.map((p) => p.handle))
      }
    }

    const toggleSelectRow = (h: string) => {
      if (selectedHandles.includes(h)) {
        setSelectedHandles(selectedHandles.filter((x) => x !== h))
      } else {
        setSelectedHandles([...selectedHandles, h])
      }
    }

    return (
      <div className="w-full space-y-6">
        {/* Üst Başlık & Yeni Sayfa Ekle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Sayfalar</h1>
            <p className="text-xs text-slate-500 mt-1">Kurumsal sayfaları (Gizlilik, KVKK, vb.) düzenleyin ve yönetin.</p>
          </div>
          <Link
            href="/admin/sayfalar?duzenle=yeni"
            className="px-5 py-2.5 rounded-xl bg-[#C98484] text-white font-extrabold text-xs hover:bg-[#A95E5E] transition inline-flex items-center gap-2 shadow-md shadow-rose-500/20 w-fit"
          >
            + Yeni Sayfa Ekle
          </Link>
        </div>

        {/* Tablar & Arama Barı & Toplu İşlemler Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          {/* Üst Sekmeler */}
          <AdminTabs label="Sayfa durumları"
            value={activeTab}
            onChange={(value) => { setActiveTab(value); setSelectedHandles([]); setBulkAction("bulk"); }}
            items={[{ value: "all", label: "Tümü", count: pages.length }, { value: "published", label: "Yayınlanmış", count: publishedCount }, { value: "draft", label: "Taslak", count: draftCount }, { value: "deleted", label: "Silinen Sayfalar", count: deletedPages.length }]}/>

          {/* Toplu İşlem & Arama Barı (Tam Olarak Ürünler Mağaza Ekranı Gibi) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Sol: Toplu İşlem Dropdown + Uygula */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#C98484]"
              >
                <option value="bulk">Toplu İşlemler</option>
                {activeTab === "deleted" ? (
                  <>
                    <option value="restore">Geri Yükle</option>
                    <option value="permanent-delete">Kalıcı Olarak Sil</option>
                  </>
                ) : (
                  <>
                    <option value="published">Yayınla</option>
                    <option value="draft">Taslağa Al</option>
                    <option value="delete">Sil (Çöp Kutusu)</option>
                  </>
                )}
              </select>
              <button
                type="button"
                onClick={handleApplyBulkAction}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition border border-slate-300 cursor-pointer"
              >
                Uygula
              </button>
            </div>

            {/* Sağ: Arama Input + Ara Butonu */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Sayfa ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-9 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5">Başlık</th>
                  <th className="px-3 py-2.5 w-24">Yazar</th>
                  <th className="px-3 py-2.5 w-28">Durum</th>
                  <th className="px-3 py-2.5 w-32 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 font-semibold">
                      Hiç sayfa bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((item) => {
                    const isSelected = selectedHandles.includes(item.handle)
                    const title = item.content?.title || names[item.handle] || item.handle
                    const slug = item.content?.custom_slug || item.handle
                    const status = item.content?.status || "published"

                    return (
                      <tr key={item.handle} className={`hover:bg-slate-50/80 transition group ${isSelected ? "bg-rose-50/40" : ""}`}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(item.handle)}
                            className="rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {activeTab === "deleted" ? (
                                <span className="font-bold text-slate-900 text-xs">{title}</span>
                              ) : (
                                <Link
                                  href={`/admin/sayfalar?duzenle=${item.handle}`}
                                  className="font-bold text-slate-900 hover:text-[#C98484] transition text-xs"
                                >
                                  {title}
                                </Link>
                              )}
                              <span className="text-[10px] text-slate-400 font-normal">
                                (/{slug})
                              </span>
                            </div>
                            {/* Hover Hızlı Aksiyon Bağlantıları */}
                            <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              {activeTab === "deleted" ? (
                                <>
                                  <button onClick={() => handleRestorePages([item.handle])} className="text-emerald-600 hover:underline cursor-pointer">Geri Yükle</button>
                                  <span className="text-slate-300">|</span>
                                  <button onClick={() => handlePermanentDeletePages([item.handle])} className="text-rose-600 hover:underline cursor-pointer">Kalıcı Sil</button>
                                </>
                              ) : (
                                <>
                                  <Link href={`/admin/sayfalar?duzenle=${item.handle}`} className="text-[#C98484] hover:underline">Düzenle</Link>
                                  <span className="text-slate-300">|</span>
                                  <button onClick={() => handleDuplicatePage(item.handle)} className="text-slate-500 hover:text-slate-900 hover:underline cursor-pointer">Çoğalt</button>
                                  <span className="text-slate-300">|</span>
                                  <Link href={`/${slug}`} target="_blank" className="text-slate-500 hover:text-slate-900 hover:underline">Görüntüle</Link>
                                  <span className="text-slate-300">|</span>
                                  <button onClick={() => handleDeletePages([item.handle])} className="text-rose-600 hover:underline cursor-pointer">Sil</button>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-500 text-xs">admin</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                              activeTab === "deleted"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : status === "published"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {activeTab === "deleted" ? "Silindi" : status === "published" ? "Yayınlanmış" : "Taslak"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {activeTab === "deleted" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRestorePages([item.handle])}
                                  title="Sayfayı Geri Yükle"
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePermanentDeletePages([item.handle])}
                                  title="Kalıcı Olarak Sil"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                            {/* ✏️ Düzenle */}
                            <Link
                              href={`/admin/sayfalar?duzenle=${item.handle}`}
                              title="Sayfayı Düzenle"
                              className="p-1.5 text-slate-400 hover:text-[#C98484] hover:bg-rose-50 rounded-lg transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                            {/* 📄 Çoğalt */}
                            <button
                              type="button"
                              onClick={() => handleDuplicatePage(item.handle)}
                              title="Sayfayı Çoğalt"
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {/* 👁️ Görüntüle */}
                            <Link
                              href={`/${slug}`}
                              target="_blank"
                              title="Sayfayı Görüntüle"
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            {/* 🗑️ Sil */}
                            <button
                              type="button"
                              onClick={() => handleDeletePages([item.handle])}
                              title="Sayfayı Sil"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── 2. SPECIAL ABOUT US (HAKKIMIZDA) PAGE EDITOR ────────────────────────────
  if (isServicePage) {
    return <ServicePageEditor />
  }

  if (isStructuredPage && editing) {
    return <StructuredPageEditor handle={editing} />
  }

  if (editing === "blog") {
    router.replace("/admin/blog")
    return null
  }

  if (isKnowledgePage && editing === "sss") {
    return <KnowledgePageEditor handle="sss" />
  }

  if (isAboutPage) {
    return (
      <div style={{ width: "100%" }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sayfalar" className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Sayfalara Dön
            </Link>
            <h2 className="text-lg font-black text-slate-900">Hakkımızda Sayfası İçerik Yönetimi</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* WordPress Style Header: Sayfa İsmi (Başlık) & Kalıcı Bağlantı (Permalink Bar) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sayfa İsmi (Başlık)
                </label>
                <input
                  type="text"
                  value={aboutInfo.title}
                  onChange={(e) => {
                    const val = e.target.value
                    setAboutInfo({ ...aboutInfo, title: val })
                    if (!isSlugManuallyEdited) {
                      setCustomSlug(slugify(val))
                    }
                  }}
                  placeholder="Sayfa İsmi (ör. Hakkımızda)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base sm:text-lg font-extrabold text-slate-900 focus:outline-none focus:border-[#0073aa] shadow-2xs"
                />
              </div>

              {/* Kalıcı Bağlantı (Permalink Bar - Dinamik Canlı Site Domaini) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Kalıcı bağlantı:</span>
                <span className="text-slate-500 font-mono">{siteOrigin}/</span>

                {slugEditing ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true)
                        setCustomSlug(slugify(e.target.value) || e.target.value)
                      }}
                      className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0073aa]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setSlugEditing(false)}
                      className="px-3 py-1 bg-[#0073aa] hover:bg-[#005177] text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Tamam
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <span className="font-bold text-[#0073aa] underline font-mono">
                      {customSlug || slugify(aboutInfo.title || editing || "hakkimizda")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSlug(customSlug || slugify(aboutInfo.title || editing || "hakkimizda"))
                        setSlugEditing(true)
                      }}
                      className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded transition cursor-pointer"
                    >
                      Düzenle
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: Page Hero Settings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-[#C98484]" />
                1. Hero Bölümü Ayarları (Sayfa Üst Alanı)
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <RichTextEditorField
                    label="Açıklama Metni & Zengin İçerik (H1 Başlık, H3 Slogan, Paragraflar)"
                    value={aboutInfo.heroText}
                    onChange={(val) => setAboutInfo({ ...aboutInfo, heroText: val })}
                    rows={6}
                    placeholder="<h1>Hakkımızda</h1>&#10;<h3>Profesyonel ekipmanlar, güvenilir çözümler.</h3>&#10;<p>Açıklama metinleri...</p>"
                  />
                </div>

                {/* 1x3 Yan Yana Grid Yerleşimi: Buton Metni | Buton Linki | Hero Görseli */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 items-start">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Buton Metni</label>
                    <input
                      type="text"
                      value={aboutInfo.heroCtaText}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, heroCtaText: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#C98484]"
                    />
                  </div>

                  <div>
                    <LinkPickerSelect
                      label="Buton Linki (Sayfa Seçici)"
                      value={aboutInfo.heroCtaHref}
                      onChange={(url) => setAboutInfo({ ...aboutInfo, heroCtaHref: url })}
                    />
                  </div>

                  <div>
                    <ImagePickerField
                      label="Hero Görseli (Sayfa Üst Görseli)"
                      value={aboutInfo.heroImage}
                      onChange={(url) => setAboutInfo({ ...aboutInfo, heroImage: url })}
                      placeholder="/brand/placeholder.svg"
                      helpText="Tıklayarak görsel seçin veya yeni yükleyin."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: "Neden Biz?" (5 Items) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <HelpCircle className="w-4 h-4 text-[#C98484]" />
                2. Neden Biz? Bölümü (5 Öğe)
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Bölüm Başlığı</label>
                  <input
                    type="text"
                    value={aboutInfo.whyTitle}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, whyTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#C98484]"
                  />
                </div>

                {/* 5 Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <label className="block font-black text-slate-900">Öğe 1</label>
                    <input
                      type="text"
                      value={aboutInfo.why1Title}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why1Title: e.target.value })}
                      placeholder="Başlık"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                    <textarea
                      rows={2}
                      value={aboutInfo.why1Desc}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why1Desc: e.target.value })}
                      placeholder="Açıklama"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <label className="block font-black text-slate-900">Öğe 2</label>
                    <input
                      type="text"
                      value={aboutInfo.why2Title}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why2Title: e.target.value })}
                      placeholder="Başlık"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                    <textarea
                      rows={2}
                      value={aboutInfo.why2Desc}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why2Desc: e.target.value })}
                      placeholder="Açıklama"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <label className="block font-black text-slate-900">Öğe 3</label>
                    <input
                      type="text"
                      value={aboutInfo.why3Title}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why3Title: e.target.value })}
                      placeholder="Başlık"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                    <textarea
                      rows={2}
                      value={aboutInfo.why3Desc}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why3Desc: e.target.value })}
                      placeholder="Açıklama"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <label className="block font-black text-slate-900">Öğe 4</label>
                    <input
                      type="text"
                      value={aboutInfo.why4Title}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why4Title: e.target.value })}
                      placeholder="Başlık"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                    <textarea
                      rows={2}
                      value={aboutInfo.why4Desc}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why4Desc: e.target.value })}
                      placeholder="Açıklama"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 sm:col-span-2 space-y-2">
                    <label className="block font-black text-slate-900">Öğe 5</label>
                    <input
                      type="text"
                      value={aboutInfo.why5Title}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why5Title: e.target.value })}
                      placeholder="Başlık"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                    <textarea
                      rows={2}
                      value={aboutInfo.why5Desc}
                      onChange={(e) => setAboutInfo({ ...aboutInfo, why5Desc: e.target.value })}
                      placeholder="Açıklama"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Misyon & Vizyon */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Target className="w-4 h-4 text-[#C98484]" />
                3. Misyonumuz & Vizyonumuz Kartları
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div className="space-y-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <label className="block text-[#C98484] font-black">Misyonumuz</label>
                  <input
                    type="text"
                    value={aboutInfo.missionTitle}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, missionTitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                  />
                  <textarea
                    rows={3}
                    value={aboutInfo.missionDesc}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, missionDesc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                  />
                </div>

                <div className="space-y-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <label className="block text-[#C98484] font-black">Vizyonumuz</label>
                  <input
                    type="text"
                    value={aboutInfo.visionTitle}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, visionTitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                  />
                  <textarea
                    rows={3}
                    value={aboutInfo.visionDesc}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, visionDesc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Stat Counters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BarChart3 className="w-4 h-4 text-[#C98484]" />
                4. İstatistik Bandı (4 Sayaç Öğesi)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <label className="block text-slate-500 font-bold">Sayaç 1</label>
                  <input
                    type="text"
                    value={aboutInfo.stat1Val}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, stat1Val: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-[#C98484]"
                  />
                  <input
                    type="text"
                    value={aboutInfo.stat1Lbl}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, stat1Lbl: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <label className="block text-slate-500 font-bold">Sayaç 2</label>
                  <input
                    type="text"
                    value={aboutInfo.stat2Val}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, stat2Val: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-[#C98484]"
                  />
                  <input
                    type="text"
                    value={aboutInfo.stat2Lbl}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, stat2Lbl: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <label className="block text-slate-500 font-bold">Sayaç 3</label>
                  <input
                    type="text"
                    value={aboutInfo.stat3Val}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, stat3Val: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-[#C98484]"
                  />
                  <input
                    type="text"
                    value={aboutInfo.stat3Lbl}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, stat3Lbl: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <label className="block text-slate-500 font-bold">Sayaç 4</label>
                  <input
                    type="text"
                    value={aboutInfo.stat4Val}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, stat4Val: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-[#C98484]"
                  />
                  <input
                    type="text"
                    value={aboutInfo.stat4Lbl}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, stat4Lbl: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Kurumsal Profil / Hakkımızda Detay */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ImageIcon className="w-4 h-4 text-[#C98484]" />
                5. Kurumsal Profil & Detay Bölümü
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 mb-1 font-bold">Bölüm Başlığı</label>
                  <input
                    type="text"
                    value={aboutInfo.aboutDetailTitle}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, aboutDetailTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#C98484]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImagePickerField
                    label="Görsel (Sol Detay Görseli)"
                    value={aboutInfo.aboutDetailImage}
                    onChange={(url) => setAboutInfo({ ...aboutInfo, aboutDetailImage: url })}
                    placeholder="/brand/placeholder.svg"
                    helpText="Tıklayarak Medya Kütüphanesinden görsel seçin veya yeni görsel yükleyin."
                  />
                </div>

                <div className="sm:col-span-2">
                  <RichTextEditorField
                    label="Açıklama Metni (Paragraflar & Zengin İçerik)"
                    value={aboutInfo.aboutDetailText}
                    onChange={(val) => setAboutInfo({ ...aboutInfo, aboutDetailText: val })}
                    rows={5}
                    placeholder="Hakkımızda detay açıklaması ve kurumsal paragraflar..."
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Buton Metni</label>
                  <input
                    type="text"
                    value={aboutInfo.aboutDetailCtaText}
                    onChange={(e) => setAboutInfo({ ...aboutInfo, aboutDetailCtaText: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#C98484]"
                  />
                </div>

                <div>
                  <LinkPickerSelect
                    label="Buton Linki (Sayfa Seçici)"
                    value={aboutInfo.aboutDetailCtaHref}
                    onChange={(url) => setAboutInfo({ ...aboutInfo, aboutDetailCtaHref: url })}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right sidebar status box */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 sticky top-6">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Yayınla</h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { setNewStatus("draft"); save() }}
                    disabled={saving}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Taslak Kaydet
                  </button>
                  <Link
                    href={`/${customSlug || "hakkimizda"}`}
                    target="_blank"
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    Ön İzleme
                  </Link>
                </div>

                <div className="flex justify-between items-center text-slate-600 font-semibold pt-1">
                  <span>Durum:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-[#C98484] cursor-pointer"
                  >
                    <option value="published">Yayınlanmış</option>
                    <option value="draft">Taslak</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="w-full py-3 bg-[#C98484] hover:bg-[#A95E5E] text-white font-black rounded-xl transition shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Değişiklikleri Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 3. SPECIAL CONTACT PAGE EDITOR ──────────────────────────────────────────
  if (isContactPage) {
    return (
      <div style={{ width: "100%" }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sayfalar" className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Sayfalara Dön
            </Link>
            <h2 className="text-lg font-black text-slate-900">İletişim Sayfası İçerik Yönetimi</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            
            {/* WordPress Style Header: Sayfa İsmi (Başlık) & Kalıcı Bağlantı (Permalink Bar) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sayfa İsmi (Başlık)
                </label>
                <input
                  type="text"
                  value={contactInfo.title}
                  onChange={(e) => {
                    const val = e.target.value
                    setContactInfo({ ...contactInfo, title: val })
                    if (!isSlugManuallyEdited) {
                      setCustomSlug(slugify(val))
                    }
                  }}
                  placeholder="Sayfa İsmi (ör. İletişim)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base sm:text-lg font-extrabold text-slate-900 focus:outline-none focus:border-[#0073aa] shadow-2xs"
                />
              </div>

              {/* Kalıcı Bağlantı (Permalink Bar - Dinamik Canlı Site Domaini) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Kalıcı bağlantı:</span>
                <span className="text-slate-500 font-mono">{siteOrigin}/</span>

                {slugEditing ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true)
                        setCustomSlug(slugify(e.target.value) || e.target.value)
                      }}
                      className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0073aa]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setSlugEditing(false)}
                      className="px-3 py-1 bg-[#0073aa] hover:bg-[#005177] text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Tamam
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <span className="font-bold text-[#0073aa] underline font-mono">
                      {customSlug || slugify(contactInfo.title || "iletisim")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSlug(customSlug || slugify(contactInfo.title || "iletisim"))
                        setSlugEditing(true)
                      }}
                      className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded transition cursor-pointer"
                    >
                      Düzenle
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 1. Hero & Header Settings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-[#C98484]" />
                1. Hero Bölümü Ayarları (Sayfa Üst Alanı)
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <RichTextEditorField
                    label="Açıklama Metni & Zengin İçerik (H1 Başlık, H3 Slogan, Paragraflar)"
                    value={contactInfo.description}
                    onChange={(val) => setContactInfo({ ...contactInfo, description: val })}
                    rows={6}
                    placeholder="<h1>İletişim</h1>&#10;<h3>7/24 Destek Ekibi</h3>&#10;<p>Açıklama metinleri...</p>"
                  />
                </div>

                {/* 1x3 Yan Yana Grid Yerleşimi: Buton Metni | Buton Linki | Hero Görseli */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 items-start">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Buton Metni</label>
                    <input
                      type="text"
                      value={contactInfo.hero_cta_text || ""}
                      onChange={(e) => setContactInfo({ ...contactInfo, hero_cta_text: e.target.value })}
                      placeholder="ör. Toptan Satış"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#C98484]"
                    />
                  </div>

                  <div>
                    <LinkPickerSelect
                      label="Buton Linki (Sayfa Seçici)"
                      value={contactInfo.hero_cta_href || ""}
                      onChange={(url) => setContactInfo({ ...contactInfo, hero_cta_href: url })}
                    />
                  </div>

                  <div>
                    <ImagePickerField
                      label="Hero Görseli (Sayfa Üst Görseli)"
                      value={contactInfo.hero_image || "/brand/placeholder.svg"}
                      onChange={(url) => setContactInfo({ ...contactInfo, hero_image: url })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 4 İletişim Kartı Ayarları */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Phone className="w-4 h-4 text-[#C98484]" />
                4'lü İletişim Kartları (Müşteri Hizmetleri, Toptan Satış, Servis, Adres)
              </h3>

              {/* Kart 1 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-[#C98484]">Kart 1: Müşteri Hizmetleri</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input type="text" placeholder="Başlık" value={contactInfo.card1_title} onChange={(e) => setContactInfo({ ...contactInfo, card1_title: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Telefon" value={contactInfo.card1_phone} onChange={(e) => setContactInfo({ ...contactInfo, card1_phone: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="email" placeholder="E-Posta" value={contactInfo.card1_email} onChange={(e) => setContactInfo({ ...contactInfo, card1_email: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Çalışma Saatleri" value={contactInfo.card1_hours} onChange={(e) => setContactInfo({ ...contactInfo, card1_hours: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <textarea placeholder="Açıklama" value={contactInfo.card1_desc} onChange={(e) => setContactInfo({ ...contactInfo, card1_desc: e.target.value })} rows={2} className="sm:col-span-2 bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-900" />
                </div>
              </div>

              {/* Kart 2 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-[#C98484]">Kart 2: Toptan ve Kurumsal Satış</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input type="text" placeholder="Başlık" value={contactInfo.card2_title} onChange={(e) => setContactInfo({ ...contactInfo, card2_title: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Telefon" value={contactInfo.card2_phone} onChange={(e) => setContactInfo({ ...contactInfo, card2_phone: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="email" placeholder="E-Posta" value={contactInfo.card2_email} onChange={(e) => setContactInfo({ ...contactInfo, card2_email: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Çalışma Saatleri" value={contactInfo.card2_hours} onChange={(e) => setContactInfo({ ...contactInfo, card2_hours: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <textarea placeholder="Açıklama" value={contactInfo.card2_desc} onChange={(e) => setContactInfo({ ...contactInfo, card2_desc: e.target.value })} rows={2} className="sm:col-span-2 bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-900" />
                </div>
              </div>

              {/* Kart 3 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-[#C98484]">Kart 3: Garanti ve Teknik Servis</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input type="text" placeholder="Başlık" value={contactInfo.card3_title} onChange={(e) => setContactInfo({ ...contactInfo, card3_title: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Telefon" value={contactInfo.card3_phone} onChange={(e) => setContactInfo({ ...contactInfo, card3_phone: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="email" placeholder="E-Posta" value={contactInfo.card3_email} onChange={(e) => setContactInfo({ ...contactInfo, card3_email: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Çalışma Saatleri" value={contactInfo.card3_hours} onChange={(e) => setContactInfo({ ...contactInfo, card3_hours: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <textarea placeholder="Açıklama" value={contactInfo.card3_desc} onChange={(e) => setContactInfo({ ...contactInfo, card3_desc: e.target.value })} rows={2} className="sm:col-span-2 bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-900" />
                </div>
              </div>

              {/* Kart 4 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-[#C98484]">Kart 4: Merkez ve İade Adresi</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input type="text" placeholder="Başlık" value={contactInfo.card4_title} onChange={(e) => setContactInfo({ ...contactInfo, card4_title: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Firma Ünvanı" value={contactInfo.card4_company} onChange={(e) => setContactInfo({ ...contactInfo, card4_company: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Ülke" value={contactInfo.card4_country} onChange={(e) => setContactInfo({ ...contactInfo, card4_country: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <input type="text" placeholder="Buton Metni" value={contactInfo.card4_map_btn} onChange={(e) => setContactInfo({ ...contactInfo, card4_map_btn: e.target.value })} className="bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900" />
                  <textarea placeholder="Açık Adres" value={contactInfo.card4_address} onChange={(e) => setContactInfo({ ...contactInfo, card4_address: e.target.value })} rows={2} className="sm:col-span-2 bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-900" />
                </div>
              </div>
            </div>

            {/* 3. Firma Bilgileri Tablosu Ayarları */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-[#C98484]" />
                Firma Bilgileri (Resmi & Kurumsal Detaylar)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Ticari Unvan</label>
                  <input type="text" value={contactInfo.company_legal_title} onChange={(e) => setContactInfo({ ...contactInfo, company_legal_title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Marka Adı</label>
                  <input type="text" value={contactInfo.company_brand} onChange={(e) => setContactInfo({ ...contactInfo, company_brand: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">MERSİS Numarası</label>
                  <input type="text" value={contactInfo.company_mersis} onChange={(e) => setContactInfo({ ...contactInfo, company_mersis: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Ticaret Sicil Numarası</label>
                  <input type="text" value={contactInfo.company_trade_reg_no} onChange={(e) => setContactInfo({ ...contactInfo, company_trade_reg_no: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">KEP Adresi</label>
                  <input type="text" value={contactInfo.company_kep} onChange={(e) => setContactInfo({ ...contactInfo, company_kep: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Vergi Dairesi</label>
                  <input type="text" value={contactInfo.company_tax_office} onChange={(e) => setContactInfo({ ...contactInfo, company_tax_office: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Vergi Numarası</label>
                  <input type="text" value={contactInfo.company_tax_no} onChange={(e) => setContactInfo({ ...contactInfo, company_tax_no: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Kurumsal Telefon</label>
                  <input type="text" value={contactInfo.company_phone} onChange={(e) => setContactInfo({ ...contactInfo, company_phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 mb-1 font-bold">Sağ Kutu Vurgu Metni (Callout)</label>
                  <input type="text" value={contactInfo.company_callout} onChange={(e) => setContactInfo({ ...contactInfo, company_callout: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
              </div>
            </div>

            {/* 4. Harita & Ziyaret Ayarları */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-[#C98484]" />
                Google Harita Embed URL & Ziyaret Alanı
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Ziyaret Alanı Başlığı</label>
                  <input type="text" value={contactInfo.visit_title} onChange={(e) => setContactInfo({ ...contactInfo, visit_title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Ziyaret Alanı Açıklaması</label>
                  <input type="text" value={contactInfo.visit_desc} onChange={(e) => setContactInfo({ ...contactInfo, visit_desc: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 mb-1 font-bold">Google Maps Embed iframe URL</label>
                  <input type="text" value={contactInfo.map_embed_url} onChange={(e) => setContactInfo({ ...contactInfo, map_embed_url: e.target.value })} placeholder="https://www.google.com/maps/embed?pb=..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 font-mono text-[11px]" />
                </div>
              </div>
            </div>

            {/* 5. İletişim Formu Ayarları */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4 h-4 text-[#C98484]" />
                İletişim Formu ve KVKK Metni
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Form Başlığı</label>
                  <input type="text" value={contactInfo.form_title} onChange={(e) => setContactInfo({ ...contactInfo, form_title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">KVKK Sayfası Bağlantısı (URL)</label>
                  <input type="text" value={contactInfo.kvkk_url || "/kvkk"} onChange={(e) => setContactInfo({ ...contactInfo, kvkk_url: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 mb-1 font-bold">Form Alt Açıklaması</label>
                  <input type="text" value={contactInfo.form_description} onChange={(e) => setContactInfo({ ...contactInfo, form_description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Yayınla</h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { setNewStatus("draft"); save() }}
                    disabled={saving}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Taslak Kaydet
                  </button>
                  <Link
                    href={`/${customSlug || "iletisim"}`}
                    target="_blank"
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    Ön İzleme
                  </Link>
                </div>

                <div className="flex justify-between items-center text-slate-600 font-semibold pt-1">
                  <span>Durum:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-[#C98484] cursor-pointer"
                  >
                    <option value="published">Yayınlanmış</option>
                    <option value="draft">Taslak</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="w-full py-3 bg-[#C98484] hover:bg-[#A95E5E] text-white font-black rounded-xl transition shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Değişiklikleri Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 3.3. BRANDS PAGE EDITOR ────────────────────────────────────────────────
  if (isBrandsPage) {
    const upd = (patch: Partial<typeof brandsInfo>) =>
      setBrandsInfo((prev) => ({ ...prev, ...patch }))

    return (
      <div style={{ width: "100%" }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sayfalar" className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Sayfalara Dön
            </Link>
            <h2 className="text-lg font-black text-slate-900">Markalarımız Sayfası İçerik Yönetimi</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">

            {/* Sayfa İsmi (Başlık) & Kalıcı Bağlantı */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sayfa İsmi (Başlık)
                </label>
                <input
                  type="text"
                  value={brandsInfo.title}
                  onChange={(e) => {
                    const val = e.target.value
                    upd({ title: val })
                    if (!isSlugManuallyEdited) {
                      setCustomSlug(slugify(val))
                    }
                  }}
                  placeholder="Sayfa İsmi (ör. Markalarımız)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base sm:text-lg font-extrabold text-slate-900 focus:outline-none focus:border-[#0073aa] shadow-2xs"
                />
              </div>

              {/* Kalıcı Bağlantı (Permalink Bar) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Kalıcı bağlantı:</span>
                <span className="text-slate-500 font-mono">{siteOrigin}/</span>

                {slugEditing ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true)
                        setCustomSlug(slugify(e.target.value))
                      }}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0073aa]"
                    />
                    <button
                      type="button"
                      onClick={() => setSlugEditing(false)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-bold"
                    >
                      Tamam
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <span className="font-bold text-[#C98484] font-mono">
                      {customSlug || "markalar"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!customSlug) setCustomSlug("markalar")
                        setSlugEditing(true)
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-bold shadow-2xs"
                    >
                      Düzenle
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BÖLÜM 1: Üst Hero / Metin Ayarları */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-[#C98484]" />
                <span>Bölüm 1: Üst Açıklama Metni (Zengin İçerik) & Hero Görseli</span>
              </h3>

              <div className="space-y-4">
                <RichTextEditorField
                  label="Açıklama Metni (Zengin İçerik)"
                  value={brandsInfo.description}
                  onChange={(val) => upd({ description: val })}
                  placeholder="Markalarımız sayfası açıklama metnini yazın..."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hero 1. Buton Metni
                    </label>
                    <input
                      type="text"
                      value={brandsInfo.hero_cta_text}
                      onChange={(e) => upd({ hero_cta_text: e.target.value })}
                      placeholder="Teklif Talebi Oluştur"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <LinkPickerSelect
                      label="Hero 1. Buton Linki"
                      value={brandsInfo.hero_cta_href}
                      onChange={(val) => upd({ hero_cta_href: val })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hero 2. Buton Metni
                    </label>
                    <input
                      type="text"
                      value={brandsInfo.secondary_cta_text}
                      onChange={(e) => upd({ secondary_cta_text: e.target.value })}
                      placeholder="Bize Ulaşın"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <LinkPickerSelect
                      label="Hero 2. Buton Linki"
                      value={brandsInfo.secondary_cta_href}
                      onChange={(val) => upd({ secondary_cta_href: val })}
                    />
                  </div>
                </div>

                <div>
                  <ImagePickerField
                    label="Hero Sağ Görseli"
                    value={brandsInfo.hero_image}
                    onChange={(val) => upd({ hero_image: val })}
                  />
                </div>
              </div>
            </div>

            {/* BÖLÜM 2: 4'lü Özellik Kartları */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-4 h-4 text-[#C98484]" />
                <span>Bölüm 2: 4'lü Özellik Çubuğu (Feature Strip)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Feat 1 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Özellik 1</span>
                  <input
                    type="text"
                    value={brandsInfo.feat1_title}
                    onChange={(e) => upd({ feat1_title: e.target.value })}
                    placeholder="Başlık (ör. Güvenilir Markalar)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  />
                  <input
                    type="text"
                    value={brandsInfo.feat1_desc}
                    onChange={(e) => upd({ feat1_desc: e.target.value })}
                    placeholder="Açıklama"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700"
                  />
                  <IconPickerField
                    value={brandsInfo.feat1_icon || "award"}
                    onOpenPicker={() => openIconPicker((val) => upd({ feat1_icon: val }))}
                  />
                </div>

                {/* Feat 2 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Özellik 2</span>
                  <input
                    type="text"
                    value={brandsInfo.feat2_title}
                    onChange={(e) => upd({ feat2_title: e.target.value })}
                    placeholder="Başlık (ör. Orijinal Ürün Garantisi)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  />
                  <input
                    type="text"
                    value={brandsInfo.feat2_desc}
                    onChange={(e) => upd({ feat2_desc: e.target.value })}
                    placeholder="Açıklama"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700"
                  />
                  <IconPickerField
                    value={brandsInfo.feat2_icon || "shield-check"}
                    onOpenPicker={() => openIconPicker((val) => upd({ feat2_icon: val }))}
                  />
                </div>

                {/* Feat 3 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Özellik 3</span>
                  <input
                    type="text"
                    value={brandsInfo.feat3_title}
                    onChange={(e) => upd({ feat3_title: e.target.value })}
                    placeholder="Başlık (ör. Uygun Fiyat Avantajı)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  />
                  <input
                    type="text"
                    value={brandsInfo.feat3_desc}
                    onChange={(e) => upd({ feat3_desc: e.target.value })}
                    placeholder="Açıklama"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700"
                  />
                  <IconPickerField
                    value={brandsInfo.feat3_icon || "tag"}
                    onOpenPicker={() => openIconPicker((val) => upd({ feat3_icon: val }))}
                  />
                </div>

                {/* Feat 4 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Özellik 4</span>
                  <input
                    type="text"
                    value={brandsInfo.feat4_title}
                    onChange={(e) => upd({ feat4_title: e.target.value })}
                    placeholder="Başlık (ör. Uzman Destek)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  />
                  <input
                    type="text"
                    value={brandsInfo.feat4_desc}
                    onChange={(e) => upd({ feat4_desc: e.target.value })}
                    placeholder="Açıklama"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700"
                  />
                  <IconPickerField
                    value={brandsInfo.feat4_icon || "headphones"}
                    onOpenPicker={() => openIconPicker((val) => upd({ feat4_icon: val }))}
                  />
                </div>
              </div>
            </div>

            {/* BÖLÜM 3: Ana Markalarımız Başlığı & Dynamic Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-[#C98484]" />
                <span>Bölüm 3: Ana Markalarımız & Buton Ayarları</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bölüm Başlığı
                  </label>
                  <input
                    type="text"
                    value={brandsInfo.main_title}
                    onChange={(e) => upd({ main_title: e.target.value })}
                    placeholder="Ana Markalarımız"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sağ Buton Metni
                  </label>
                  <input
                    type="text"
                    value={brandsInfo.main_cta_text}
                    onChange={(e) => upd({ main_cta_text: e.target.value })}
                    placeholder="Tüm Markaları Görüntüle"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <LinkPickerSelect
                    label="Sağ Buton Linki"
                    value={brandsInfo.main_cta_href}
                    onChange={(val) => upd({ main_cta_href: val })}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-slate-700 space-y-1">
                <span className="font-extrabold text-[#C98484] block">💡 Otomatik Dinamik Marka Yönetimi:</span>
                <p className="leading-relaxed">
                  Markalar veritabanınızdan (<strong>Ürünler &gt; Markalar</strong> bölümünden) çekilmektedir. Admin panelinden yeni marka eklediğinizde bu alanda otomatik görüntülenecektir.
                </p>
              </div>
            </div>

            {/* BÖLÜM 4: Size Özel Marka ve Ürün Çözümleri (Alt CTA Kartı) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <HelpCircle className="w-4 h-4 text-[#C98484]" />
                <span>Bölüm 5: Size Özel Marka ve Ürün Çözümleri (Alt CTA Kartı)</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kart Başlığı
                    </label>
                    <input
                      type="text"
                      value={brandsInfo.cta_title}
                      onChange={(e) => upd({ cta_title: e.target.value })}
                      placeholder="Size Özel Marka ve Ürün Çözümleri"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kart Açıklaması
                    </label>
                    <input
                      type="text"
                      value={brandsInfo.cta_desc}
                      onChange={(e) => upd({ cta_desc: e.target.value })}
                      placeholder="İhtiyacınıza uygun marka teklifleri..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase">1. Buton (Teklif Talebi)</span>
                    <input
                      type="text"
                      value={brandsInfo.cta_btn1_text}
                      onChange={(e) => upd({ cta_btn1_text: e.target.value })}
                      placeholder="Teklif Talebi Oluştur"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    />
                    <LinkPickerSelect
                      label="1. Buton Linki"
                      value={brandsInfo.cta_btn1_href}
                      onChange={(val) => upd({ cta_btn1_href: val })}
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase">2. Buton (Bize Ulaşın)</span>
                    <input
                      type="text"
                      value={brandsInfo.cta_btn2_text}
                      onChange={(e) => upd({ cta_btn2_text: e.target.value })}
                      placeholder="Bize Ulaşın"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    />
                    <LinkPickerSelect
                      label="2. Buton Linki"
                      value={brandsInfo.cta_btn2_href}
                      onChange={(val) => upd({ cta_btn2_href: val })}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sağ Kolon: Yayın Ayarları & Aksiyonlar */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Yayınla</h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { setNewStatus("draft"); save() }}
                    disabled={saving}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Taslak Kaydet
                  </button>
                  <Link
                    href={`/${customSlug || "markalar"}`}
                    target="_blank"
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    Ön İzleme
                  </Link>
                </div>

                <div className="flex justify-between items-center text-slate-600 font-semibold pt-1">
                  <span>Durum:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-[#C98484] cursor-pointer"
                  >
                    <option value="published">Yayınlanmış</option>
                    <option value="draft">Taslak</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="w-full py-3 bg-[#C98484] hover:bg-[#A95E5E] text-white font-black rounded-xl transition shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Değişiklikleri Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 3.4. WHOLESALE PAGE EDITOR ─────────────────────────────────────────────
  if (isWholesalePage) {
    const upd = (patch: Partial<typeof wholesaleInfo>) =>
      setWholesaleInfo((prev) => ({ ...prev, ...patch }))

    return (
      <div style={{ width: "100%" }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sayfalar" className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Sayfalara Dön
            </Link>
            <h2 className="text-lg font-black text-slate-900">Toptan ve Kurumsal Satış Sayfası İçerik Yönetimi</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">

            {/* Sayfa İsmi (Başlık) & Kalıcı Bağlantı (Permalink Bar) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sayfa İsmi (Başlık)
                </label>
                <input
                  type="text"
                  value={wholesaleInfo.title}
                  onChange={(e) => {
                    const val = e.target.value
                    upd({ title: val })
                    if (!isSlugManuallyEdited) {
                      setCustomSlug(slugify(val))
                    }
                  }}
                  placeholder="Sayfa İsmi (ör. Toptan ve Kurumsal Satış)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base sm:text-lg font-extrabold text-slate-900 focus:outline-none focus:border-[#0073aa] shadow-2xs"
                />
              </div>

              {/* Kalıcı Bağlantı (Permalink Bar - Dinamik Canlı Site Domaini) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Kalıcı bağlantı:</span>
                <span className="text-slate-500 font-mono">{siteOrigin}/</span>

                {slugEditing ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true)
                        setCustomSlug(slugify(e.target.value) || e.target.value)
                      }}
                      className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0073aa]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setSlugEditing(false)}
                      className="px-3 py-1 bg-[#0073aa] hover:bg-[#005177] text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Tamam
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <a
                      href={`/${customSlug || "toptan-ve-kurumsal-satis"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0073aa] hover:underline font-mono font-bold"
                    >
                      {customSlug || "toptan-ve-kurumsal-satis"}
                    </a>
                    <button
                      type="button"
                      onClick={() => setSlugEditing(true)}
                      className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded transition cursor-pointer"
                    >
                      Düzenle
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 1. Hero Bölümü */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-[#C98484]" />
                1. Hero Bölümü Ayarları
              </h3>
              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <RichTextEditorField
                    label="Başlık & Açıklama Metni (H1 başlık desteklenir)"
                    value={wholesaleInfo.description}
                    onChange={(val) => upd({ description: val })}
                    rows={5}
                    placeholder="<h1>Toptan ve Kurumsal Satış</h1>&#10;<p>Açıklama...</p>"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">1. Buton Metni</label>
                    <input type="text" value={wholesaleInfo.hero_cta1_text} onChange={(e) => upd({ hero_cta1_text: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#C98484]" placeholder="Teklif Talebi Oluştur" />
                  </div>
                  <div>
                    <LinkPickerSelect label="1. Buton Linki" value={wholesaleInfo.hero_cta1_href} onChange={(val) => upd({ hero_cta1_href: val })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">2. Buton Metni</label>
                    <input type="text" value={wholesaleInfo.hero_cta2_text} onChange={(e) => upd({ hero_cta2_text: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#C98484]" placeholder="Bize Ulaşın" />
                  </div>
                </div>
                <div>
                  <ImagePickerField
                    label="Hero Görseli"
                    value={wholesaleInfo.hero_image}
                    onChange={(val) => upd({ hero_image: val })}
                    placeholder="/brand/placeholder.svg"
                  />
                </div>
              </div>
            </div>

            {/* 2. Özellik Kartları (6 Adet - Hero Altı - 3x2 Düzen) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-4 h-4 text-[#C98484]" />
                2. Özellik Kartları (6 Adet - Hero Altı - 3x2 Düzen)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                  <div key={n} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <span className="font-extrabold text-slate-800 text-[11px] block">{n}. Özellik</span>
                    <input type="text" value={(wholesaleInfo as any)[`feat${n}_title`] || ""} onChange={(e) => upd({ [`feat${n}_title`]: e.target.value } as any)} className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900" placeholder="Başlık" />
                    <input type="text" value={(wholesaleInfo as any)[`feat${n}_desc`] || ""} onChange={(e) => upd({ [`feat${n}_desc`]: e.target.value } as any)} className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600" placeholder="Açıklama" />
                    <IconPickerField
                      value={(wholesaleInfo as any)[`feat${n}_icon`] || ""}
                      onOpenPicker={() => openIconPicker((val) => upd({ [`feat${n}_icon`]: val } as any))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Neden Bizi Seçmelisiniz? + 4 Stat */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Target className="w-4 h-4 text-[#C98484]" />
                3. Neden Bizi Seçmelisiniz? Alanı & Sayaçlar
              </h3>
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bölüm Başlığı</label>
                  <input type="text" value={wholesaleInfo.why_title} onChange={(e) => upd({ why_title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#C98484]" placeholder="Örn: Neden Bizi Seçmelisiniz?" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Açıklama Metni</label>
                  <textarea value={wholesaleInfo.why_desc} onChange={(e) => upd({ why_desc: e.target.value })} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#C98484] resize-none" placeholder="Açıklama..." />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <div key={n} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="font-extrabold text-slate-800 text-[11px] block">Sayaç {n}</span>
                      <input type="text" value={(wholesaleInfo as any)[`stat${n}_value`] || ""} onChange={(e) => upd({ [`stat${n}_value`]: e.target.value } as any)} className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-black text-[#C98484]" placeholder="Değer" />
                      <input type="text" value={(wholesaleInfo as any)[`stat${n}_label`] || ""} onChange={(e) => upd({ [`stat${n}_label`]: e.target.value } as any)} className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600" placeholder="Etiket" />
                      <IconPickerField
                        value={(wholesaleInfo as any)[`stat${n}_icon`] || ""}
                        onOpenPicker={() => openIconPicker((val) => upd({ [`stat${n}_icon`]: val } as any))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Kimler İçin Uygun */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-[#C98484]" />
                4. Kimler İçin Uygun? Kartı (3x2 Düzen)
              </h3>
              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kart Başlığı</label>
                  <input type="text" value={wholesaleInfo.target_title} onChange={(e) => upd({ target_title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:bg-white focus:border-[#C98484] outline-none transition" />
                </div>
                
                {/* 3x2 Izgara Alanı (Madde 1 .. Madde 6) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                    <div key={n} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Madde {n}</label>
                      <input
                        type="text"
                        value={(wholesaleInfo as any)[`target_item${n}`] || ""}
                        onChange={(e) => upd({ [`target_item${n}`]: e.target.value } as any)}
                        placeholder={`Örn. Madde ${n}`}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#C98484] outline-none transition"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Toptan Satış Sürecimiz (6 Adım - 3x2 Düzen) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BarChart3 className="w-4 h-4 text-[#C98484]" />
                5. Toptan Satış Süreci (6 Adım - 3x2 Düzen)
              </h3>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bölüm Başlığı</label>
                <input type="text" value={wholesaleInfo.process_title} onChange={(e) => upd({ process_title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#C98484]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                  <div key={n} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <span className="font-extrabold text-slate-800 text-[11px]">Adım {n}</span>
                    <input type="text" value={(wholesaleInfo as any)[`step${n}_title`] || ""} onChange={(e) => upd({ [`step${n}_title`]: e.target.value } as any)} className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900" placeholder="Başlık" />
                    <input type="text" value={(wholesaleInfo as any)[`step${n}_desc`] || ""} onChange={(e) => upd({ [`step${n}_desc`]: e.target.value } as any)} className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600" placeholder="Açıklama" />
                    <IconPickerField
                      value={(wholesaleInfo as any)[`step${n}_icon`] || ""}
                      onOpenPicker={() => openIconPicker((val) => upd({ [`step${n}_icon`]: val } as any))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 6. İletişim Formu */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4 h-4 text-[#C98484]" />
                6. İletişim Formu Ayarları
              </h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">İletişim Formunu Bu Sayfada Göster</span>
                  <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                    Aktif edildiğinde, sayfa altında merkezi iletişim formu (İletişim & Mesajlar panelinde yönetilen ana şablon) çekilir.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wholesaleInfo.show_contact_form !== false}
                    onChange={(e) => upd({ show_contact_form: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C98484]"></div>
                </label>
              </div>
            </div>

          </div>

          {/* Sağ Sidebar - Yayınla & Ayarlar Standart Kartı */}
          <aside className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
                Yayınla & Ayarlar
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { setNewStatus("draft"); save() }}
                    disabled={saving}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Taslak Kaydet
                  </button>
                  <a
                    href={`/${customSlug || "toptan-ve-kurumsal-satis"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    Ön İzleme
                  </a>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-600">Durum:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#C98484]"
                  >
                    <option value="published">Yayınlanmış</option>
                    <option value="draft">Taslak</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="w-full py-3 bg-[#C98484] hover:bg-[#A95E5E] text-white font-black rounded-xl transition shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Değişiklikleri Güncelle"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    )
  }

  // ── 3.5. SPECIAL DELIVERY AND RETURNS PAGE EDITOR ─────────────────────────────
  if (isDeliveryPage) {

    return (
      <div style={{ width: "100%" }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sayfalar" className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Sayfalara Dön
            </Link>
            <h2 className="text-lg font-black text-slate-900">Teslimat, İptal ve İade Koşulları İçerik Yönetimi</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            
            {/* WordPress Style Header: Sayfa İsmi (Başlık) & Kalıcı Bağlantı (Permalink Bar) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sayfa İsmi (Başlık)
                </label>
                <input
                  type="text"
                  value={deliveryInfo.title}
                  onChange={(e) => {
                    const val = e.target.value
                    setDeliveryInfo({ ...deliveryInfo, title: val })
                    if (!isSlugManuallyEdited) {
                      setCustomSlug(slugify(val))
                    }
                  }}
                  placeholder="Sayfa İsmi (ör. Teslimat, İptal ve İade Koşulları)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base sm:text-lg font-extrabold text-slate-900 focus:outline-none focus:border-[#0073aa] shadow-2xs"
                />
              </div>

              {/* Kalıcı Bağlantı (Permalink Bar - Dinamik Canlı Site Domaini) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Kalıcı bağlantı:</span>
                <span className="text-slate-500 font-mono">{siteOrigin}/</span>

                {slugEditing ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true)
                        setCustomSlug(slugify(e.target.value) || e.target.value)
                      }}
                      className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0073aa]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setSlugEditing(false)}
                      className="px-3 py-1 bg-[#0073aa] hover:bg-[#005177] text-white font-bold text-xs rounded transition cursor-pointer"
                    >
                      Tamam
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <span className="font-bold text-[#0073aa] underline font-mono">
                      {customSlug || slugify(deliveryInfo.title || "teslimat-ve-iade")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSlug(customSlug || slugify(deliveryInfo.title || "teslimat-ve-iade"))
                        setSlugEditing(true)
                      }}
                      className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded transition cursor-pointer"
                    >
                      Düzenle
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 1. Hero & Header Settings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-[#C98484]" />
                1. Hero Bölümü Ayarları (Sayfa Üst Alanı)
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <RichTextEditorField
                    label="Açıklama Metni & Zengin İçerik (H1 Başlık, H3 Slogan, Paragraflar)"
                    value={deliveryInfo.description}
                    onChange={(val) => setDeliveryInfo({ ...deliveryInfo, description: val })}
                    rows={6}
                    placeholder="<h1>Teslimat, İptal ve İade Koşulları</h1>&#10;<h3>MÜŞTERİ BİLGİLENDİRME</h3>&#10;<p>Açıklama metinleri...</p>"
                  />
                </div>

                {/* 1x3 Side-by-Side Izgara Kontrolü (Hakkımızda & İletişim Standartlarında) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Buton Metni (İsteğe Bağlı)
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.hero_cta_text || ""}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, hero_cta_text: e.target.value })}
                      placeholder="ör. İletişime Geçin"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#C98484]"
                    />
                  </div>

                  <div>
                    <LinkPickerSelect
                      label="Buton Linki (Sayfa Seçici)"
                      value={deliveryInfo.hero_cta_href || ""}
                      onChange={(val) => setDeliveryInfo({ ...deliveryInfo, hero_cta_href: val })}
                    />
                  </div>

                  <div>
                    <ImagePickerField
                      label="Hero Görseli (Sağ Alan)"
                      value={deliveryInfo.hero_image}
                      onChange={(val) => setDeliveryInfo({ ...deliveryInfo, hero_image: val })}
                      placeholder="/brand/placeholder.svg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Sol Sütun Koşul Maddeleri (Tek Zengin Metin Alanı - h3 Başlıklı Akordeonlar) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-[#C98484]" />
                2. Koşul Maddeleri & Akordeon İçerikleri (Zengin İçerik Editörü)
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <RichTextEditorField
                  label="Sayfa Ana Metin Alanı (h3 Başlıkları Akordeon Maddelerine Dönüşür)"
                  value={deliveryInfo.content_html || ""}
                  onChange={(val) => setDeliveryInfo({ ...deliveryInfo, content_html: val })}
                  rows={14}
                  placeholder="<h3>🚚 Siparişlerin Hazırlanması</h3>&#10;<p>Açıklama...</p>"
                />
              </div>
            </div>

            {/* 3. Sağ Sütun Kart Ayarları */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-[#C98484]" />
                3. Sağ Kolon Kartları & İade Adımları Ayarları
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-extrabold text-slate-900 block">İade Süreci Buton Ayarı</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={deliveryInfo.process_btn_text}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, process_btn_text: e.target.value })}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold"
                      placeholder="Buton Metni"
                    />
                    <LinkPickerSelect
                      label="Buton Linki"
                      value={deliveryInfo.process_btn_href}
                      onChange={(val) => setDeliveryInfo({ ...deliveryInfo, process_btn_href: val })}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sağ Sütun Sidebar (Yayınla & Sayfa Sağ Kartları Yönetimi) */}
          <div className="space-y-6">
            
            {/* Yayınla & Ayarlar Kartı */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
                Yayınla & Ayarlar
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { setNewStatus("draft"); save() }}
                    disabled={saving}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Taslak Kaydet
                  </button>
                  <Link
                    href={`/${customSlug || "teslimat-ve-iade"}`}
                    target="_blank"
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    Ön İzleme
                  </Link>
                </div>

                <div className="flex justify-between items-center text-slate-600 font-semibold">
                  <span>Durum:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-[#C98484] cursor-pointer"
                  >
                    <option value="published">Yayınlanmış</option>
                    <option value="draft">Taslak</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="w-full py-3 bg-[#C98484] hover:bg-[#A95E5E] text-white font-black rounded-xl transition shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Değişiklikleri Güncelle"}
                </button>
              </div>
            </div>

            {/* Sağ Kart 1: Öne Çıkan Bilgiler Yönetimi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C98484]" />
                Öne Çıkan Bilgiler Kartı
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Kart Başlığı</label>
                  <input
                    type="text"
                    value={deliveryInfo.highlight_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, highlight_title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    placeholder="Öne Çıkan Bilgiler"
                  />
                </div>

                {/* Madde 1 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">1. Kargo Bilgisi</span>
                  <input
                    type="text"
                    value={deliveryInfo.h1_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h1_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.h1_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h1_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>

                {/* Madde 2 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">2. Ücretsiz Kargo</span>
                  <input
                    type="text"
                    value={deliveryInfo.h2_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h2_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.h2_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h2_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>

                {/* Madde 3 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">3. İade Süresi</span>
                  <input
                    type="text"
                    value={deliveryInfo.h3_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h3_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.h3_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h3_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>

                {/* Madde 4 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">4. Garanti</span>
                  <input
                    type="text"
                    value={deliveryInfo.h4_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h4_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.h4_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h4_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>

                {/* Madde 5 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">5. Destek</span>
                  <input
                    type="text"
                    value={deliveryInfo.h5_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h5_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.h5_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, h5_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>
              </div>
            </div>

            {/* Sağ Kart 2: İade Süreci Nasıl İşler? Yönetimi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#C98484]" />
                İade Süreci Adımları Kartı
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Kart Başlığı</label>
                  <input
                    type="text"
                    value={deliveryInfo.process_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, process_title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    placeholder="İade Süreci Nasıl İşler?"
                  />
                </div>

                {/* Adım 1 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">Adım 1</span>
                  <input
                    type="text"
                    value={deliveryInfo.step1_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, step1_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.step1_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, step1_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>

                {/* Adım 2 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">Adım 2</span>
                  <input
                    type="text"
                    value={deliveryInfo.step2_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, step2_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.step2_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, step2_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>

                {/* Adım 3 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">Adım 3</span>
                  <input
                    type="text"
                    value={deliveryInfo.step3_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, step3_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.step3_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, step3_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>

                {/* Adım 4 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px]">Adım 4</span>
                  <input
                    type="text"
                    value={deliveryInfo.step4_title || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, step4_title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <input
                    type="text"
                    value={deliveryInfo.step4_desc || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, step4_desc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                    placeholder="Açıklama"
                  />
                </div>

                {/* İade Talebi Buton Ayarı */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 pt-2">
                  <span className="font-extrabold text-slate-900 text-[11px] block">İade Talebi Buton Ayarı</span>
                  <input
                    type="text"
                    value={deliveryInfo.process_btn_text || ""}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, process_btn_text: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    placeholder="Buton Metni"
                  />
                  <LinkPickerSelect
                    label="Buton Linki"
                    value={deliveryInfo.process_btn_href || ""}
                    onChange={(val) => setDeliveryInfo({ ...deliveryInfo, process_btn_href: val })}
                  />
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ── 4. STANDARD PAGE EDITOR (OTHER / NEW PAGES) ────────────────────────────
  const currentSlugDisplay = customSlug || slugify(newTitle)

  return (
    <div className="w-full space-y-6">
      {/* Sayfalara Dön & Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <Link
            href="/admin/sayfalar"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#C98484] transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Sayfalara Dön
          </Link>
          <h1 className="text-xl font-black text-slate-900">
            {newTitle ? `${newTitle} Sayfası İçerik Yönetimi` : isNewPage ? "Yeni Sayfa İçerik Yönetimi" : "Sayfa Düzenle"}
          </h1>
        </div>
      </div>

      {/* Grid: 3 Kolon Sol (%75) / 1 Kolon Sağ (%25) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Sol Ana Düzenleme Alanı (%75) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Kart 1: SAYFA İSMİ (BAŞLIK) & KALICI BAĞLANTI */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                SAYFA İSMİ (BAŞLIK)
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value)
                  if (!isSlugManuallyEdited) {
                    setCustomSlug(slugify(e.target.value))
                  }
                }}
                placeholder="Örn. Gizlilik Politikası veya İletişim"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484] transition"
              />
            </div>

            {/* Kalıcı Bağlantı Alanı */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700">Kalıcı bağlantı:</span>
                {slugEditing ? (
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[#C98484] font-bold">{siteOrigin}/</span>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true)
                        setCustomSlug(slugify(e.target.value) || e.target.value)
                      }}
                      className="bg-white border border-[#C98484] rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none min-w-[160px]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setSlugEditing(false)}
                      className="px-3 py-1 bg-[#C98484] text-white rounded-lg text-xs font-extrabold hover:bg-[#A95E5E] transition cursor-pointer"
                    >
                      Tamam
                    </button>
                  </div>
                ) : (
                  <span className="text-[#C98484] font-bold underline">
                    {siteOrigin}/{currentSlugDisplay || "sayfa-adi"}
                  </span>
                )}
              </div>

              {!slugEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomSlug(currentSlugDisplay)
                    setSlugEditing(true)
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-lg transition cursor-pointer"
                >
                  Düzenle
                </button>
              )}
            </div>
          </div>

          {/* Kart 2: 🔥 1. Hero Bölümü Ayarları (Sayfa Üst Alanı) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-[#C98484]" />
              🔥 1. Hero Bölümü Ayarları (Sayfa Üst Alanı)
            </h3>

            <div className="space-y-4">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                AÇIKLAMA METNİ & ZENGİN İÇERİK (H1 BAŞLIK, H3 SLOGAN, PARAGRAFLAR)
              </label>

              <RichTextEditorField
                value={newDescription}
                onChange={(val) => setNewDescription(val)}
                placeholder="Sayfa açıklama metnini ve zengin içeriğini buraya girin..."
              />
            </div>

            {/* Alt 3 Ayar: Buton Metni, Buton Linki, Hero Görseli */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 items-end">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  BUTON METNİ
                </label>
                <input
                  type="text"
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="Örn. Toptan Satış"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484] transition"
                />
              </div>

              <div>
                <LinkPickerSelect
                  label="BUTON LİNKİ (SAYFA SEÇİCİ)"
                  value={heroCtaHref}
                  onChange={(val) => setHeroCtaHref(val)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  HERO GÖRSELİ (SAYFA ÜST GÖRSELİ)
                </label>
                <ImagePickerField
                  value={heroImage}
                  onChange={(val) => setHeroImage(val)}
                  label=""
                  placeholder="/brand/placeholder.svg"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Sağ Sütun Sidebar (%25) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
              Yayınla
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setNewStatus("draft"); save() }}
                  disabled={saving}
                  className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Taslak Kaydet
                </button>
                <Link
                  href={`/${currentSlugDisplay || "sayfa"}`}
                  target="_blank"
                  className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  Ön İzleme
                </Link>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-semibold pt-1">
                <span>Durum:</span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-[#C98484] cursor-pointer"
                >
                  <option value="published">Yayınlanmış</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="w-full py-3 bg-[#C98484] hover:bg-[#A95E5E] text-white font-black rounded-xl transition shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : isNewPage ? "Yayınla" : "Değişiklikleri Güncelle"}
              </button>
            </div>
          </div>
        </div>

        <IconPickerModal
          isOpen={iconPickerState.isOpen}
          onClose={closeIconPicker}
          onSelect={(iconNameOrUrl) => {
            iconPickerState.onSelect(iconNameOrUrl)
            closeIconPicker()
          }}
        />
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
  rows = 12,
}: {
  label: string
  value?: string
  onChange: (value: string) => void
  textarea?: boolean
  rows?: number
}) {
  const style = {
    width: "100%",
    boxSizing: "border-box" as const,
    border: "1px solid #8c8f94",
    borderRadius: 4,
    padding: "9px 10px",
    font: "inherit",
  }
  return (
    <label style={{ display: "block", marginBottom: 16, fontWeight: 600 }}>
      {label}
      {textarea ? (
        <textarea
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          style={{ ...style, marginTop: 7, resize: "vertical" }}
        />
      ) : (
        <input
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          style={{ ...style, marginTop: 7 }}
        />
      )}
    </label>
  )
}

const panelStyle = {
  background: "#fff",
  border: "1px solid #dcdcde",
  borderRadius: 0,
  padding: 20,
  alignSelf: "start" as const,
}

const buttonStyle = {
  background: "#C98484",
  color: "#fff",
  border: 0,
  borderRadius: 3,
  padding: "7px 14px",
  fontWeight: 600,
  cursor: "pointer",
}
