export interface SeoTokens {
  urun_adi?: string
  urun?: string
  title?: string
  postname?: string
  kategori?: string
  category?: string
  marka?: string
  brand?: string
  fiyat?: string
  price?: string
  sku?: string
  stok_kodu?: string
  site_adi?: string
  sitename?: string
  ayirici?: string
  sep?: string
  separator?: string
  sayfa_adi?: string
  page_title?: string
  yazi_basligi?: string
  blog_title?: string
  yazi_ozeti?: string
  ozet?: string
  excerpt?: string
  yil?: string
  year?: string
  [key: string]: string | undefined
}

export const DEFAULT_SEO_TEMPLATES = {
  separator: "|",
  siteName: "Mağaza",
  productTitle: "%urun_adi% %ayirici% %site_adi%",
  productDesc: "%urun_adi% ürününü %site_adi% üzerinde inceleyin.",
  categoryTitle: "%kategori% %ayirici% %site_adi%",
  categoryDesc: "%kategori% kategorisindeki seçenekleri %site_adi% üzerinde inceleyin.",
  brandTitle: "%marka% Ürünleri ve Fiyatları %ayirici% %site_adi%",
  brandDesc: "%marka% ürünlerini %site_adi% üzerinde inceleyin.",
  blogTitle: "%yazi_basligi% %ayirici% %site_adi%",
  blogDesc: "%yazi_ozeti%",
  pageTitle: "%sayfa_adi% %ayirici% %site_adi%",
}

export function renderSeoTemplate(template: string, tokens: SeoTokens): string {
  if (!template) return ""
  
  const siteName = tokens.site_adi || tokens.sitename || DEFAULT_SEO_TEMPLATES.siteName
  const separator = tokens.ayirici || tokens.sep || tokens.separator || DEFAULT_SEO_TEMPLATES.separator
  const year = tokens.yil || tokens.year || new Date().getFullYear().toString()
  
  const fullTokens: Record<string, string> = {
    urun_adi: tokens.urun_adi || tokens.title || tokens.postname || "",
    urun: tokens.urun_adi || tokens.title || "",
    title: tokens.urun_adi || tokens.title || tokens.postname || "",
    postname: tokens.urun_adi || tokens.title || tokens.postname || "",
    kategori: tokens.kategori || tokens.category || "",
    category: tokens.kategori || tokens.category || "",
    marka: tokens.marka || tokens.brand || "",
    brand: tokens.marka || tokens.brand || "",
    fiyat: tokens.fiyat || tokens.price || "",
    price: tokens.fiyat || tokens.price || "",
    sku: tokens.sku || tokens.stok_kodu || "",
    stok_kodu: tokens.sku || tokens.stok_kodu || "",
    site_adi: siteName,
    sitename: siteName,
    ayirici: separator,
    sep: separator,
    separator: separator,
    sayfa_adi: tokens.sayfa_adi || tokens.page_title || "",
    page_title: tokens.sayfa_adi || tokens.page_title || "",
    yazi_basligi: tokens.yazi_basligi || tokens.blog_title || "",
    blog_title: tokens.yazi_basligi || tokens.blog_title || "",
    yazi_ozeti: tokens.yazi_ozeti || tokens.ozet || tokens.excerpt || "",
    ozet: tokens.yazi_ozeti || tokens.ozet || tokens.excerpt || "",
    excerpt: tokens.yazi_ozeti || tokens.ozet || tokens.excerpt || "",
    yil: year,
    year: year,
  }

  let result = template
  for (const [key, value] of Object.entries(fullTokens)) {
    const pattern = new RegExp(`%${key}%`, "gi")
    result = result.replace(pattern, value || "")
  }

  return result
    .replace(/\s+/g, " ")
    .replace(/^\s*[-|•—»]\s*/, "")
    .replace(/\s*[-|•—»]\s*$/, "")
    .trim()
}

// Shared by the storefront metadata and the admin preview.
export function getSiteSeoMetadata(settings: Record<string, any> | null | undefined) {
  return {
    siteName: settings?.logo_text || "Mağaza",
    title: settings?.seo_meta_title || settings?.logo_text || "Online Mağaza",
    description: settings?.seo_meta_description || settings?.footer_description || "",
  }
}
