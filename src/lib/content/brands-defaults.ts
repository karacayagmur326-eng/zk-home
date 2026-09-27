export const defaultBrandsPageInfo = {
  title: "Markalarımız",
  description: "<p>Mağazada yer alacak markalar ve marka açıklamaları yönetim panelinden eklenecektir.</p>",
  hero_image: "/brand/placeholder.svg",
  hero_cta_text: "Teklif Talebi Oluştur",
  hero_cta_href: "/toptan-ve-kurumsal-satis",
  secondary_cta_text: "Bize Ulaşın",
  secondary_cta_href: "/iletisim",
  feat1_title: "Marka Bilgileri", feat1_desc: "Marka detayları katalogla birlikte yayınlanacaktır.", feat1_icon: "award",
  feat2_title: "Ürün Koşulları", feat2_desc: "Koşullar ilgili ürün sayfasında belirtilecektir.", feat2_icon: "shield-check",
  feat3_title: "Güncel Fiyatlar", feat3_desc: "Fiyatlar ürünler yayınlandığında görüntülenecektir.", feat3_icon: "tag",
  feat4_title: "İletişim", feat4_desc: "İletişim bilgileri mağaza açılmadan önce eklenecektir.", feat4_icon: "headphones",
  main_title: "Ana Markalarımız",
  main_cta_text: "Tüm Markaları Görüntüle",
  main_cta_href: "/magaza",
  cta_title: "Size Özel Marka ve Ürün Çözümleri",
  cta_desc: "İhtiyacınıza uygun marka, ürün ve fiyat teklifleri için uzman ekibimizle iletişime geçin.",
  cta_btn1_text: "Teklif Talebi Oluştur",
  cta_btn1_href: "/toptan-ve-kurumsal-satis",
  cta_btn2_text: "Bize Ulaşın",
  cta_btn2_href: "/iletisim",
}

export function withoutPartnerSection<T extends Record<string, any>>(value: T) {
  const {
    partner_title: _partnerTitle,
    partner_sub_text: _partnerSubText,
    partner_sub_href: _partnerSubHref,
    ...rest
  } = value
  return rest
}
