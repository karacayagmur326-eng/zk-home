export type EditorialCard = {
  id: string
  title: string
  description: string
  image: string
  href: string
  active: boolean
}

export type HomeEditorialContent = {
  collections_active: boolean
  collections_title: string
  collections_description: string
  collections_link_text: string
  collections_link_href: string
  collection_cards: EditorialCard[]
  highlights_active: boolean
  highlights_title: string
  highlights_description: string
  highlight_cards: EditorialCard[]
  banner_active: boolean
  banner_title: string
  banner_accent: string
  banner_description: string
  banner_image: string
  banner_link_text: string
  banner_link_href: string
  rooms_active: boolean
  rooms_title: string
  rooms_description: string
  room_cards: EditorialCard[]
  inspiration_active: boolean
  inspiration_title: string
  inspiration_description: string
  newsletter_active: boolean
  newsletter_title: string
  newsletter_description: string
}

export const defaultHomeEditorialContent: HomeEditorialContent = {
  collections_active: true,
  collections_title: "Yeni Sezon Koleksiyonu",
  collections_description: "Evinizin her köşesi için ilham veren, zamansız tasarımlar.",
  collections_link_text: "Tüm Koleksiyonu Keşfet",
  collections_link_href: "/magaza",
  collection_cards: [
    { id: "collection-decor", title: "Dekorasyon", description: "Yaşam alanlarınıza karakter katan parçalar", image: "/editorial/collection-decor.png", href: "/dekorasyon", active: true },
    { id: "collection-table", title: "Mutfak & Sofra", description: "Sofralarınıza zarafet katan tasarımlar", image: "/editorial/collection-table.png", href: "/mutfak-sofra", active: true },
    { id: "collection-textile", title: "Tekstil", description: "Konfor ve şıklığı bir arada sunan seçkiler", image: "/editorial/collection-textile.png", href: "/tekstil", active: true },
  ],
  highlights_active: true,
  highlights_title: "Öne Çıkan Seçkiler",
  highlights_description: "Evinize iyi gelecek, özenle seçilmiş parçalar.",
  highlight_cards: [
    { id: "highlight-dinnerware", title: "Yemek Takımları", description: "Sofranıza uyum sağlayan modeller", image: "/editorial/collection-table.png", href: "/mutfak-sofra/yemek-takimlari", active: true },
    { id: "highlight-decor", title: "Dekoratif Objeler", description: "Küçük dokunuşlarla yeni bir görünüm", image: "/editorial/collection-decor.png", href: "/dekorasyon/dekoratif-objeler", active: true },
    { id: "highlight-textile", title: "Nevresim Takımları", description: "Yatak odasına yumuşak bir dokunuş", image: "/editorial/collection-textile.png", href: "/tekstil/yatak-odasi/nevresim-takimlari", active: true },
    { id: "highlight-bath", title: "Havlular", description: "Günlük konfor için yumuşak seçenekler", image: "/editorial/room-bath.png", href: "/banyo/havlu", active: true },
  ],
  banner_active: true,
  banner_title: "Evinize",
  banner_accent: "İyi Gelen Dokunuşlar",
  banner_description: "Doğal dokular, zamansız tasarımlar ve yaşam alanlarınızı güzelleştiren özel seçkiler.",
  banner_image: "/editorial/living-banner.png",
  banner_link_text: "Koleksiyonu Keşfet",
  banner_link_href: "/magaza",
  rooms_active: true,
  rooms_title: "Yaşam Alanına Göre Keşfet",
  rooms_description: "Her alan için özel seçkilerle evinizin tüm hikâyesini tamamlayın.",
  room_cards: [
    { id: "room-living", title: "Salon", description: "", image: "/editorial/collection-decor.png", href: "/dekorasyon", active: true },
    { id: "room-kitchen", title: "Mutfak", description: "", image: "/editorial/collection-table.png", href: "/mutfak-sofra", active: true },
    { id: "room-bedroom", title: "Yatak Odası", description: "", image: "/editorial/collection-textile.png", href: "/tekstil/yatak-odasi", active: true },
    { id: "room-bath", title: "Banyo", description: "", image: "/editorial/room-bath.png", href: "/banyo", active: true },
  ],
  inspiration_active: true,
  inspiration_title: "İlham Köşesi",
  inspiration_description: "Eviniz için fikirler, dekorasyon önerileri ve trendler.",
  newsletter_active: true,
  newsletter_title: "Yeni koleksiyonlar ve ilham veren seçkiler için bültenimize katılın.",
  newsletter_description: "E-posta tercihinizi dilediğiniz zaman değiştirebilirsiniz.",
}
