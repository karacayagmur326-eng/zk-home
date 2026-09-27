export type ServiceIconItem = {
  title: string
  desc: string
  icon: string
}

export const defaultServicePageData = {
  title: "Garanti ve Teknik Servis",
  subtitle: "Satış Sonrası Destek",
  description:
    "Mağazamızdan aldığınız ürünler için garanti kapsamı, teknik inceleme, bakım ve servis süreçlerinde uzman ekibimiz yanınızda.",
  hero_image: "/brand/placeholder.svg",

  feature_cards: [
    { title: "2 Yıl Resmi Garanti", desc: "Uygun ürünler üretici ve ithalatçı garantisi kapsamındadır.", icon: "shield-check" },
    { title: "Yetkili Teknik Servis", desc: "Arıza ve bakım ihtiyaçlarınız uzman ekipler tarafından değerlendirilir.", icon: "wrench" },
    { title: "Hızlı Çözüm", desc: "Servis talepleriniz kayıt altına alınır ve süreç boyunca bilgilendirilirsiniz.", icon: "clock-3" },
    { title: "Orijinal Yedek Parça", desc: "Bakım ve onarımlarda uygun ve güvenilir parçalar kullanılır.", icon: "badge-check" },
  ] as ServiceIconItem[],

  coverage_title: "Garanti Kapsamı",
  coverage_intro: "Aşağıdaki durumlar, ürün ve garanti belgesindeki koşullar saklı kalmak üzere değerlendirilir:",
  coverage_items: [
    "Üretim ve malzeme kaynaklı arızalar",
    "Normal kullanım koşullarında oluşan teknik sorunlar",
    "Ürünle birlikte verilen kullanım kılavuzuna uygun kullanım",
    "Yetkili servislerimiz tarafından yapılan işlemler",
  ],
  exclusion_title: "Garanti Kapsamı Dışında Kalan Durumlar",
  exclusion_items: [
    "Kullanım hataları ve darbe kaynaklı hasarlar",
    "Yetkisiz kişiler tarafından yapılan müdahaleler",
    "Doğal afet, yangın, su baskını gibi dış etkenler",
    "Sarf malzemeleri ve aksesuarlar",
  ],

  process_title: "Teknik Servis Süreci",
  process_steps: [
    { title: "Talep Oluşturun", desc: "Formu doldurarak servis talebinizi bize iletin.", icon: "headphones" },
    { title: "Ürününüzü Gönderin", desc: "Ürününüzü anlaşmalı kargo veya servis noktasına gönderin.", icon: "package" },
    { title: "İnceleme", desc: "Uzman ekibimiz ürünü inceleyerek arıza tespiti yapar.", icon: "search" },
    { title: "Bilgilendirme", desc: "Arıza ve çözüm süreci hakkında onayınız alınır.", icon: "clipboard-list" },
    { title: "Onarım", desc: "Onayınız sonrası ürününüz uygun parçalarla onarılır.", icon: "wrench" },
    { title: "Teslimat", desc: "Ürününüz test edilerek güvenli şekilde teslim edilir.", icon: "package-check" },
  ] as ServiceIconItem[],

  show_contact_form: true,
  contact_title: "Teknik Servis İletişim",
  contact_description: "Her türlü teknik servis ve garanti desteği için bizimle iletişime geçebilirsiniz.",
  phone: "",
  phone_note: "Hafta içi 09:00 - 18:00",
  email: "",
  email_note: "24 saat içinde yanıtlanır.",
  address: "",
  map_link: "https://maps.google.com",
  status: "published",
}
