export type NavigationItem = {
  id?: string
  label: string
  url?: string
  type?: "custom" | "category" | "page"
  imageUrl?: string
  iconName?: string
  description?: string
  children?: NavigationItem[]
  // Mega Menu Promo Card
  promo_enabled?: boolean
  promo_badge?: string
  promo_title?: string
  promo_description?: string
  promo_image_url?: string
  promo_button_text?: string
  promo_button_url?: string
}

export type NavigationMenu = {
  id: string
  name: string
  handle?: string
  location: string[]
  items: NavigationItem[]
}
