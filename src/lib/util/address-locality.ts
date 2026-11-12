type AddressLocality = {
  postal_code?: string | null
  province?: string | null
  city?: string | null
}

// Checkout stores the Turkish district in province and the city in city.
export function formatAddressLocality(address: AddressLocality): string {
  const locality = [address.province?.trim(), address.city?.trim()].filter(Boolean).join(" / ")
  return [address.postal_code?.trim(), locality].filter(Boolean).join(" ") || "İl / ilçe belirtilmemiş"
}
