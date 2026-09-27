/**
 * Product concepts are matched as groups of equivalent catalogue expressions.
 * A concept must not require the administrator to repeat the canonical label
 * word-for-word in every product title, tag and description.
 */
const FEATURE_CONCEPT_ALIASES: Record<string, string[]> = {
  "komursuz motor": ["komursuz", "brushless", "fircasiz motor"],
  "komurlu motor": ["komurlu", "karbon fircali", "fircali motor"],
  "metal sanziman": ["metal sanziman"],
  "celik sanziman": ["celik sanziman"],
  "cift aku": ["cift aku", "cift akulu", "iki aku", "2 aku", "2 akulu"],
  "li ion": ["li ion", "lion", "lityum iyon", "lityum"],
  darbeli: ["darbeli", "darbe ozelligi"],
  "bakir sargili": ["bakir sargili", "bakir sargi"],
}

export function normalizeProductContext(value: unknown) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function containsPhrase(document: string, phrase: string) {
  return ` ${document} `.includes(` ${phrase} `)
}

export function featureConceptAliases(feature: string) {
  const normalizedFeature = normalizeProductContext(feature)
  return FEATURE_CONCEPT_ALIASES[normalizedFeature] || [normalizedFeature]
}

export function matchesFeatureConcept(document: unknown, feature: string) {
  const normalizedDocument = normalizeProductContext(document)
  if (!normalizedDocument) return false
  return featureConceptAliases(feature).some((alias) =>
    containsPhrase(normalizedDocument, normalizeProductContext(alias))
  )
}

export function matchesAllFeatureConcepts(
  document: unknown,
  features: string[],
) {
  return features.every((feature) => matchesFeatureConcept(document, feature))
}

export function compactProductEvidence(input: {
  title: string
  subtitle?: string | null
  description?: string | null
  type?: string | null
  brand?: string | null
  skus?: string | null
  categories?: string | null
  tags?: string | null
  metadata?: Record<string, unknown> | null
}) {
  const metadata = input.metadata || {}
  const metadataFacts = Object.entries(metadata)
    .filter(([key, value]) =>
      !/(image|thumbnail|icon|password|secret|token|api.?key|seo|slug|url)/i.test(key) &&
      ["string", "number", "boolean"].includes(typeof value)
    )
    .slice(0, 12)
    .map(([key, value]) => `${key}: ${String(value)}`)

  return [
    input.brand ? `Marka/koleksiyon: ${input.brand}` : "",
    input.skus ? `Model/SKU: ${input.skus}` : "",
    input.type ? `Ürün tipi: ${input.type}` : "",
    input.categories ? `Kategoriler: ${input.categories}` : "",
    input.tags ? `Etiketler: ${input.tags}` : "",
    input.subtitle ? `Alt başlık: ${input.subtitle}` : "",
    input.description
      ? `Açıklama: ${input.description.replace(/\s+/g, " ").trim().slice(0, 520)}`
      : "",
    ...metadataFacts,
  ].filter(Boolean)
}
