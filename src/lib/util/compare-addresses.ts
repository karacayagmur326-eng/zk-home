export default function compareAddresses(address1: object, address2: object) {
  const keys = [
    "first_name",
    "last_name",
    "address_1",
    "company",
    "postal_code",
    "city",
    "country_code",
    "province",
    "phone",
  ] as const
  const first = address1 as Record<string, unknown>
  const second = address2 as Record<string, unknown>
  return keys.every(
    (key) => (first?.[key] ?? null) === (second?.[key] ?? null)
  )
}
