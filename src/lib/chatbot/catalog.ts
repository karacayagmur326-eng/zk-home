import "server-only"

import { query } from "@lib/admin/db"
import { ChatbotSettings } from "./config"
import { normalizeChatbotText } from "./settings"
import { isLowInformationTerm, QueryUnderstanding, understandQuery } from "./understanding"
import type { CatalogQueryHint } from "./taxonomy-core"
import {
  compactProductEvidence,
  matchesAllFeatureConcepts,
} from "./product-context"

export type ChatbotProductResult = {
  title: string
  url: string
  price: string
  thumbnail: string
  available: boolean
  brand?: string
  model?: string
  facts?: string[]
}

type CatalogRow = {
  id: string
  title: string
  handle: string
  subtitle: string | null
  description: string | null
  type_value: string | null
  thumbnail: string | null
  metadata: Record<string, unknown> | null
  brand: string | null
  skus: string | null
  variant_titles: string | null
  price: string | number | null
  available: boolean
  categories: string | null
  tags: string | null
  category_ids: string[] | null
  tag_ids: string[] | null
}

const SEARCH_STOP_WORDS = new Set([
  "bana", "bende", "bizde", "sende", "sizde", "siz", "icin", "olan", "hangi", "hangisi", "hangileri", "nedir", "neler",
  "urun", "urunler", "urunleri", "fiyat", "fiyati", "fiyatli", "kadar", "goster", "listele",
  "misin", "musun", "misiniz", "musunuz", "var", "mi", "mu", "varmi", "varmidir", "yokmu", "bir", "daha", "sitede", "sitenizde", "sizd",
  "ucuz", "ucuzu", "uygun", "pahali", "pahalisi", "stokta", "mevcut", "yapiyor",
  "sey", "seyler", "birsey", "birseyler", "acaba", "lazim", "ariyorum", "bakiyorum", "istiyorum", "olur", "midir",
  "icin", "kullanmak", "kullanacagim", "kullanacagiz", "adet", "hakkinda", "bilgi", "ver", "anlat", "acikla",
])

const GENERIC_CATALOG_TERMS = new Set([
  "urun", "alet", "makine", "model", "secenek", "fiyat", "stok", "rpm", "w", "v", "mm", "cm", "ah", "hp",
])

const MEASUREMENT_UNITS = new Set(["rpm", "w", "v", "mm", "cm", "ah", "hp"])

const CONCRETE_PRODUCT_TERMS = new Set([
  "matkap", "vidalama", "testere", "kesme", "profil", "kaynak", "budama", "taslama", "zimpara", "tirpan",
  "kirici", "somun", "motor", "planya", "freze", "makine", "alet",
])

const SITE_INFORMATION_TERMS = new Set([
  "kvkk", "kisisel", "veri", "gizlilik", "cerez", "iletisim", "telefon", "eposta", "adres", "kargo", "iade",
  "teslimat", "garanti", "kategori", "sorumluluk", "sozlesme", "siparis", "odeme", "hakkimizda", "firma",
])

const PRODUCT_TOKEN_ALIASES: Array<[string, string[]]> = [
  ["rpm", ["rpm", "pmr", "rmp", "mpr"]],
  ["w", ["w", "watt", "wat"]],
  ["v", ["v", "volt"]],
  ["mm", ["mm", "milimetre", "milim"]],
  ["cm", ["cm", "santimetre", "santim"]],
  ["ah", ["ah", "amper", "ampersaat"]],
  ["hp", ["hp", "beygir"]],
  ["matkap", ["matkap", "matkab"]],
  ["vidalama", ["vidalama", "vidalam"]],
  ["testere", ["testere"]],
  ["kesme", ["kes", "kesme", "kesim"]],
  ["profil", ["profil"]],
  ["kaynak", ["kaynak", "kaynakci"]],
  ["budama", ["budama", "buda"]],
  ["taslama", ["taslama", "taslam"]],
  ["zimpara", ["zimpara", "zimparala"]],
  ["tirpan", ["tirpan", "tirpan"]],
  ["kirici", ["kirici", "kirma", "hilti"]],
  ["somun", ["somun"]],
  ["motor", ["motor"]],
  ["planya", ["planya"]],
  ["freze", ["freze"]],
  ["makine", ["makine", "makina"]],
  ["alet", ["alet"]],
]

function canonicalizeProductToken(token: string) {
  const withoutPlural = token.replace(/(lar|ler)$/i, "")
  for (const [canonical, aliases] of PRODUCT_TOKEN_ALIASES) {
    if (aliases.some((alias) => withoutPlural === alias || (alias.length >= 4 && withoutPlural.startsWith(alias)))) {
      return canonical
    }
  }
  return withoutPlural
}

type Measurement = { value: number; unit: string }

function extractMeasurements(tokens: string[]): Measurement[] {
  const result: Measurement[] = []
  const seen = new Set<string>()
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (!/^\d+$/.test(tokens[index]) || !MEASUREMENT_UNITS.has(tokens[index + 1])) continue
    const value = Number(tokens[index])
    const key = `${value}:${tokens[index + 1]}`
    if (Number.isFinite(value) && !seen.has(key)) {
      seen.add(key)
      result.push({ value, unit: tokens[index + 1] })
    }
  }
  return result
}

function formatMeasurement(measurement: Measurement) {
  return `${measurement.value.toLocaleString("tr-TR")} ${measurement.unit.toLocaleUpperCase("tr-TR")}`
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0]
    previous[0] = i
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j]
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1)
      )
      diagonal = above
    }
  }
  return previous[right.length]
}

function isAdjacentTransposition(left: string, right: string) {
  if (left.length !== right.length) return false
  const differences: number[] = []
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) differences.push(index)
    if (differences.length > 2) return false
  }
  return differences.length === 2
    && differences[1] === differences[0] + 1
    && left[differences[0]] === right[differences[1]]
    && left[differences[1]] === right[differences[0]]
}

function matchSearchTerm(term: string, searchableTokens: string[]) {
  if (searchableTokens.includes(term)) return { matched: true, fuzzy: false }
  if (term.length >= 4 && searchableTokens.some((token) => token.startsWith(term) || term.startsWith(token))) {
    return { matched: true, fuzzy: false }
  }
  const tolerance = term.length >= 8 ? 2 : term.length >= 5 ? 1 : 0
  if (tolerance > 0 && searchableTokens.some((token) => Math.abs(token.length - term.length) <= tolerance && (editDistance(term, token) <= tolerance || isAdjacentTransposition(term, token)))) {
    return { matched: true, fuzzy: true }
  }
  return { matched: false, fuzzy: false }
}

function formatPrice(value: string | number | null) {
  const amount = Number(value || 0) / 100
  return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
}

function toProduct(row: CatalogRow): ChatbotProductResult {
  const facts = compactProductEvidence({
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    type: row.type_value,
    brand: row.brand,
    skus: row.skus,
    categories: row.categories,
    tags: row.tags,
    metadata: row.metadata,
  })
  return {
    title: row.title,
    url: `/urunler/${row.handle}`,
    price: formatPrice(row.price),
    thumbnail: row.thumbnail || "",
    available: row.available,
    brand: row.brand || undefined,
    model: row.skus || row.variant_titles || undefined,
    facts,
  }
}

let catalogSnapshot: { rows: CatalogRow[]; expiresAt: number } | null = null

async function getCatalogRows() {
  if (catalogSnapshot && catalogSnapshot.expiresAt > Date.now()) return catalogSnapshot.rows
  const rows = await query<CatalogRow>(
    `SELECT p.id,p.title,p.handle,p.subtitle,p.description,p.type_value,p.thumbnail,p.metadata,
       MAX(col.title) AS brand,
       STRING_AGG(DISTINCT NULLIF(v.sku,''),' ') AS skus,
       STRING_AGG(DISTINCT NULLIF(v.title,''),' ') AS variant_titles,
       MIN(v.price) FILTER (WHERE v.price > 0) AS price,
       COALESCE(BOOL_OR(v.stock > 0 OR v.allow_backorder),FALSE) AS available,
       STRING_AGG(DISTINCT c.name,' ') AS categories,
       STRING_AGG(DISTINCT t.value,' ') AS tags,
       ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.id),NULL) AS category_ids,
       ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.id),NULL) AS tag_ids
     FROM store_product p
     LEFT JOIN store_variant v ON v.product_id=p.id
     LEFT JOIN store_collection col ON col.id=p.collection_id
     LEFT JOIN store_product_category pc ON pc.product_id=p.id
     LEFT JOIN store_category c ON c.id=pc.category_id
     LEFT JOIN store_product_tag pt ON pt.product_id=p.id
     LEFT JOIN store_tag t ON t.id=pt.tag_id
     WHERE p.status='published' AND p.deleted_at IS NULL
     GROUP BY p.id,p.title,p.handle,p.subtitle,p.description,p.type_value,p.thumbnail,p.metadata
     HAVING MIN(v.price) FILTER (WHERE v.price > 0) IS NOT NULL`
  ).catch(() => [])
  catalogSnapshot = { rows, expiresAt: Date.now() + 120_000 }
  return rows
}

function rowSearchable(row: CatalogRow) {
  return normalizeChatbotText([
    row.title, row.handle, row.subtitle, row.description, row.type_value,
    row.brand, row.skus, row.variant_titles, row.categories, row.tags,
    JSON.stringify(row.metadata || {}),
  ].filter(Boolean).join(" "))
}

function rowMatchesCategory(row: CatalogRow, category: string | null) {
  if (!category) return true
  const searchable = rowSearchable(row)
  const aliases: Record<string, string[]> = {
    matkap: ["matkap", "vidalama"],
    testere: ["testere", "budama", "dekupaj", "sunsta"],
    "profil kesme": ["profil kesme", "profil kesim"],
    "kaynak makinesi": ["kaynak"],
    "tırpan": ["tirpan"],
    "taşlama": ["taslama", "spiral"],
    "kırıcı delici": ["kirici", "delici", "hilti"],
    "somun sıkma": ["somun", "bijon"],
    "zımpara": ["zimpara"],
    planya: ["planya"], freze: ["freze"], "kompresör": ["kompresor"],
    "boya tabancası": ["boya tabancasi"], "karıştırıcı": ["karistirici", "mikser"],
  }
  return (aliases[category] || normalizeChatbotText(category).split(" ")).some((term) => searchable.includes(term))
}

const VERIFIED_FEATURES: Array<[string, string[]]> = [
  ["metal şanzıman", ["metal sanziman"]], ["çelik şanzıman", ["celik sanziman"]],
  ["çift akü", ["cift aku", "2 aku"]], ["Li-ion", ["li ion", "lityum iyon"]],
  ["darbeli", ["darbeli"]], ["bakır sargılı", ["bakir sargili"]], ["kömürsüz motor", ["komursuz", "brushless"]],
]

function verifiedFeatures(rows: CatalogRow[]) {
  const corpus = rows.map(rowSearchable).join(" ")
  return VERIFIED_FEATURES.filter(([, aliases]) => aliases.some((alias) => corpus.includes(alias))).map(([label]) => label)
}

function catalogSubject(understanding: QueryUnderstanding, fallbackTerms: string[]) {
  const category = understanding.productCategory
  const features = understanding.features.map((feature) => {
    if (category === "matkap" && feature === "kömürsüz motor") return "kömürsüz"
    if (category === "matkap" && feature === "kömürlü motor") return "kömürlü"
    return feature
  })
  const specifications = [
    understanding.entities.voltage != null ? `${understanding.entities.voltage}V` : "",
    understanding.entities.batteryCapacity != null ? `${understanding.entities.batteryCapacity}Ah` : "",
    understanding.entities.power != null ? `${understanding.entities.power}W` : "",
    understanding.entities.torque != null ? `${understanding.entities.torque}Nm` : "",
    understanding.entities.color || "",
  ]
  const parts = [...specifications, ...features, category || ""].filter(Boolean)
  return Array.from(new Set(parts)).join(" ") || fallbackTerms.join(" ")
}

export async function analyzeCatalogQuestion(
  message: string,
  settings: ChatbotSettings,
  providedUnderstanding?: QueryUnderstanding,
  providedCatalogHint?: CatalogQueryHint | null
) {
  if (!settings.catalog_search_enabled) return null

  const understanding = providedUnderstanding || understandQuery(message)
  const catalogHint = providedCatalogHint || understanding.catalogHint
  const normalized = understanding.correctedQuery
  const normalizedTokens = normalized.split(" ").filter(Boolean)
  const messageTokens = normalized
    .split(" ")
    .filter(Boolean)
    .map(canonicalizeProductToken)
  const asksForCategoryInformation = understanding.intent === "CATEGORY_DISCOVERY"
  const hasConcreteProduct = Boolean(understanding.productCategory)
    || Boolean(understanding.productModel)
    || Boolean(understanding.entities.sku)
    || understanding.features.length > 0
    || Boolean(catalogHint)
    || messageTokens.some((token) => CONCRETE_PRODUCT_TERMS.has(token))
  const hasMeasurement = messageTokens.some((token) => MEASUREMENT_UNITS.has(token))
  const hasGenericCatalogIntent = messageTokens.some((token) => ["urun", "fiyat", "stok", "model"].includes(token))
  const hasSiteInformationIntent = messageTokens.some((token) => SITE_INFORMATION_TERMS.has(token))
  const catalogIntents = new Set(["GENERAL_PRODUCT_QUALITY", "PRODUCT_QUALITY", "PURCHASE_ADVICE", "PRODUCT_DURABILITY", "PRODUCT_PERFORMANCE", "USE_CASE_SUITABILITY", "PRODUCT_DISCOVERY", "PRODUCT_COMPARISON", "PRODUCT_SPECIFICATION", "PRICE_QUERY", "STOCK_QUERY", "ACCESSORY_COMPATIBILITY"])
  if (catalogIntents.has(understanding.intent) && understanding.needsClarification) {
    return {
      answer: understanding.intent === "PRODUCT_PERFORMANCE" || understanding.aspect === "performance"
        ? "Farklı güç ve performans seviyelerinde ürün seçeneklerimiz var; ancak performans ürün grubuna ve yapılacak işe göre değerlendirilmelidir. Matkapta voltaj ve tork, testerede güç ve kesme kapasitesi, tırpanda ise motor gücü öne çıkar. Hangi iş için ürün aradığınızı yazarsanız canlı katalogdan uygun modelleri karşılaştırabilirim."
        : understanding.intent === "USE_CASE_SUITABILITY"
        ? "Hangi ürünün hangi işte kullanılacağını soruyorsunuz? Ürün grubunu veya modeli yazarsanız sitedeki gerçek teknik özelliklerden kontrol edebilirim."
        : understanding.intent === "PRODUCT_COMPARISON" || understanding.intent === "PRODUCT_DURABILITY"
          ? "Hangi ürün grubunu veya hangi iki modeli karşılaştırmamı istersiniz? Modelleri yazarsanız gerçek teknik bilgileri üzerinden değerlendirebilirim."
          : "Hangi ürün veya ürün grubunu kastettiğinizi yazarsanız canlı katalogdan kontrol edebilirim.",
      source: "catalog_clarification" as const,
    }
  }
  if (asksForCategoryInformation || !catalogIntents.has(understanding.intent) || (!hasConcreteProduct && !hasMeasurement && (!hasGenericCatalogIntent || hasSiteInformationIntent) && !["GENERAL_PRODUCT_QUALITY", "PURCHASE_ADVICE"].includes(understanding.intent))) {
    return null
  }
  const entityTerms = [
    ...(understanding.entities.brand ? normalizeChatbotText(understanding.entities.brand).split(" ") : []),
    ...(understanding.productModel ? normalizeChatbotText(understanding.productModel).split(" ") : []),
    ...(understanding.entities.sku ? normalizeChatbotText(understanding.entities.sku).split(" ") : []),
    ...(understanding.productCategory ? normalizeChatbotText(understanding.productCategory).split(" ") : []),
    ...understanding.features.flatMap((item) => normalizeChatbotText(item).split(" ")),
    ...(understanding.useCase ? normalizeChatbotText(understanding.useCase).split(" ") : []),
    ...(understanding.entities.color ? [understanding.entities.color] : []),
  ]
  const searchTerms = Array.from(new Set([
    ...entityTerms,
    ...(catalogHint?.matchedTerms || []),
    ...messageTokens.filter(
      (token) => token.length > 2 && !SEARCH_STOP_WORDS.has(token) && !isLowInformationTerm(token)
    ),
  ])).map(canonicalizeProductToken)
  const specificTerms = searchTerms.filter((token) => !GENERIC_CATALOG_TERMS.has(token))
  const requestedMeasurements = [
    understanding.entities.voltage != null ? { value: understanding.entities.voltage, unit: "v" } : null,
    understanding.entities.batteryCapacity != null ? { value: understanding.entities.batteryCapacity, unit: "ah" } : null,
    understanding.entities.power != null ? { value: understanding.entities.power, unit: "w" } : null,
    understanding.entities.torque != null ? { value: understanding.entities.torque, unit: "nm" } : null,
    understanding.entities.rpm != null ? { value: understanding.entities.rpm, unit: "rpm" } : null,
    understanding.entities.size ? { value: understanding.entities.size.value, unit: understanding.entities.size.unit } : null,
  ].filter((item): item is Measurement => Boolean(item))

  const allRows = await getCatalogRows()
  const rows = allRows.filter((row) => {
    if (catalogHint?.categoryIds.length) {
      const rowCategoryIds = row.category_ids || []
      if (!rowCategoryIds.some((id) => catalogHint.categoryIds.includes(id))) return false
    } else if (!catalogHint && !rowMatchesCategory(row, understanding.productCategory)) {
      return false
    }
    if (catalogHint?.tagIds.length) {
      const rowTagIds = row.tag_ids || []
      const queryHasCategory = Boolean(catalogHint.categoryIds.length)
      if (!queryHasCategory && !rowTagIds.some((id) => catalogHint.tagIds.includes(id))) return false
    }
    return true
  })

  const asksForOverview = /\b(neler|nelerdir|urunler|urunleri|urunleriniz|urunlerinizi|cesit|cesitleri|oner|onerir)\b/.test(normalized)
  if (catalogHint?.category && catalogHint.childCategories.length && asksForOverview) {
    const preferredChildIds = new Set(catalogHint.childCategories.map((item) => item.id))
    const preferredRows = rows.filter((row) => (row.category_ids || []).some((id) => preferredChildIds.has(id)))
    const displayRows = preferredRows.length ? preferredRows : rows
    const categoryNames = catalogHint.childCategories.map((item) => item.name)
    return {
      answer: `**${catalogHint.category.name} grubunda ${categoryNames.join(", ")} seçenekleri bulunuyor.**\n\nİhtiyacınızı veya yapacağınız işi yazarsanız bu gruplardaki ürünleri fiyat, stok ve doğrulanmış teknik özelliklerine göre daha ayrıntılı karşılaştırabilirim.`,
      products: displayRows.slice(0, settings.max_product_results).map(toProduct),
      link_url: `/kategoriler/${catalogHint.category.handle}`,
      link_text: `${catalogHint.category.name} Kategorisini İncele`,
      source: "catalog_taxonomy_overview" as const,
      evidence: categoryNames,
    }
  }

  if (["GENERAL_PRODUCT_QUALITY", "PURCHASE_ADVICE", "PRODUCT_QUALITY", "PRODUCT_DURABILITY"].includes(understanding.intent)) {
    if (understanding.needsClarification) {
      return {
        answer: "Hangi ürün grubunu soruyorsunuz? Ürün türünü ve kullanım amacınızı yazarsanız daha net yardımcı olabilirim.",
        source: "catalog_clarification" as const,
      }
    }
    const features = verifiedFeatures(rows).slice(0, 3)
    const subject = understanding.productCategory ? `${understanding.productCategory} grubunda` : "ZK Home ürünlerinde"
    const evidence = [
      features.length ? `${features.join(", ")} gibi doğrulanabilir özelliklere sahip modeller bulunuyor` : "özellikler modele göre değişiyor",
      "varsa ürüne özel garanti bilgileri ürün açıklamasında belirtilir; yasal tüketici hakları saklıdır",
    ]
    const prefix = understanding.intent === "PURCHASE_ADVICE"
      ? "Alınabilir; ancak doğru seçim yapacağınız işe göre değişir."
      : understanding.intent === "PRODUCT_DURABILITY"
        ? `Dayanıklılık modelin gerçek donanımına göre değişir; ${subject} bütün modeller aynı değildir.`
        : understanding.intent === "GENERAL_PRODUCT_QUALITY"
          ? "ZK Home ürünlerinde kaliteyi yalnızca bir iddia olarak değil; modelin gerçek teknik donanımı, kullanım amacına uygunluğu ve satış sonrası desteğiyle değerlendiriyoruz."
        : `${subject} kalite ve donanım modelden modele değişir.`
    return {
      answer: `${prefix} Katalogda ${evidence.join(" ve ")}. Ne işte kullanacağınızı söylerseniz uygun modelleri teknik verileriyle karşılaştırabilirim.`,
      products: understanding.productCategory ? rows.slice(0, 3).map(toProduct) : undefined,
      link_url: understanding.productCategory ? undefined : "/magaza",
      link_text: understanding.productCategory ? undefined : "Ürünleri İncele",
      source: "catalog_grounded_guidance" as const,
      evidence: [features.join(", "), "Garanti kapsamı ürün bazında belirtilir."].filter(Boolean),
    }
  }

  if (searchTerms.length === 0 && !understanding.productCategory) return null

  const scored = rows
    .map((row) => {
      const title = normalizeChatbotText(row.title)
      const searchable = rowSearchable(row)
      const titleTokens = title.split(" ").filter(Boolean).map(canonicalizeProductToken)
      const searchableTokens = searchable.split(" ").filter(Boolean).map(canonicalizeProductToken)
      const measurements = extractMeasurements(searchableTokens)
      let score = 0
      let specificMatches = 0
      let fuzzyMatches = 0
      for (const term of searchTerms) {
        const titleMatch = matchSearchTerm(term, titleTokens)
        const contentMatch = titleMatch.matched ? titleMatch : matchSearchTerm(term, searchableTokens)
        if (!contentMatch.matched) continue
        score += titleMatch.matched ? (titleMatch.fuzzy ? 4 : 6) : (contentMatch.fuzzy ? 1 : 3)
        if (specificTerms.includes(term)) specificMatches += 1
        if (contentMatch.fuzzy) fuzzyMatches += 1
      }
      const requiredSpecificMatches = Math.max(understanding.productCategory ? 0 : 1, Math.ceil(specificTerms.length * 0.5))
      const measurementNumbers = new Set(requestedMeasurements.map((measurement) => String(measurement.value)))
      const standaloneNumericTermsMatch = specificTerms
        .filter((term) => /^\d+$/.test(term))
        .filter((term) => !measurementNumbers.has(term))
        .every((term) => searchableTokens.includes(term))
      const measurementsMatch = requestedMeasurements.every((requested) =>
        measurements.some((current) => current.unit === requested.unit && current.value === requested.value)
      )
      const entityConstraintMatch = matchesAllFeatureConcepts(searchable, understanding.features)
        && (!understanding.entities.color || searchable.includes(understanding.entities.color))
      const specificMatch = (specificTerms.length === 0 || specificMatches >= requiredSpecificMatches) && standaloneNumericTermsMatch && measurementsMatch && entityConstraintMatch
      return { row, score, specificMatch, specificMatches, fuzzyMatches, measurements }
    })

  const ranked = scored
    .filter((item) => (item.score > 0 || Boolean(understanding.productCategory)) && item.specificMatch)

  if (ranked.length === 0 && requestedMeasurements.length > 0) {
    const requested = requestedMeasurements[0]
    const nearest = scored
      .flatMap((item) => item.measurements
        .filter((measurement) => measurement.unit === requested.unit)
        .map((measurement) => ({ ...item, measurement })))
      .filter((item) => item.score > 0)
      .sort((left, right) => {
        const leftDistance = Math.abs(Math.log((left.measurement.value || 1) / (requested.value || 1)))
        const rightDistance = Math.abs(Math.log((right.measurement.value || 1) / (requested.value || 1)))
        if (leftDistance !== rightDistance) return leftDistance - rightDistance
        return right.score - left.score
      })
    const closest = nearest[0]?.measurement
    if (closest) {
      const limit = Math.min(Math.max(settings.max_product_results || 4, 1), 8)
      const uniqueNearest = Array.from(new Map(nearest
        .filter((item) => item.measurement.value === closest.value)
        .map((item) => [item.row.handle, item])).values())
      const nearestProducts = uniqueNearest
        .slice(0, limit)
        .map((item) => toProduct(item.row))
      return {
        answer: `${formatMeasurement(requested)} değerinde bir ürün bulamadım. En yakın mevcut teknik değer ${formatMeasurement(closest)}. “${formatMeasurement(closest)}” ürünlerini mi arıyordunuz? Uygun seçenekleri aşağıda inceleyebilirsiniz.`,
        products: nearestProducts,
        source: "catalog_nearest_spec" as const,
      }
    }
  }

  if (ranked.length === 0) return null

  const cheapest = understanding.entities.priceIntent === "cheapest"
  const expensive = understanding.entities.priceIntent === "highest"
  ranked.sort((a, b) => {
    if (cheapest) return Number(a.row.price) - Number(b.row.price)
    if (expensive) return Number(b.row.price) - Number(a.row.price)
    if (b.score !== a.score) return b.score - a.score
    if (a.row.available !== b.row.available) return a.row.available ? -1 : 1
    return Number(a.row.price) - Number(b.row.price)
  })

  const relevanceFloor = ranked[0].score * 0.65
  const selected = ranked
    .filter((item) => item.score >= relevanceFloor)
    .slice(0, Math.min(Math.max(settings.max_product_results || 4, 1), 8))
  const products: ChatbotProductResult[] = selected.map(({ row }) => toProduct(row))

  const subject = catalogSubject(understanding, searchTerms)
  const needsClarification = selected[0].fuzzyMatches > 0 || selected[0].specificMatches < specificTerms.length
  const firstSearchable = rowSearchable(selected[0].row)
  const asksAvailability = /\b(var mi|bulunuyor mu|mevcut mu|satiyor musunuz|satiliyor mu)\b/.test(normalized)
  const suitabilityAnswer = understanding.intent === "USE_CASE_SUITABILITY" && understanding.useCase
    ? understanding.useCase === "beton delme" || understanding.useCase === "duvar delme"
      ? firstSearchable.includes("darbeli")
        ? `${products[0].title} modelinin site bilgisinde darbeli özelliği doğrulanıyor; bu nedenle ${understanding.useCase} için değerlendirilebilir. Uygun uç ve çalışma sınırları için ürün detaylarını da kontrol edin.`
        : `Bu modelin site bilgisinde darbe özelliğini doğrulayamadım; bu yüzden ${understanding.useCase} için uygun olduğunu kesin söyleyemem.`
      : understanding.useCase === "demir kesme" && /metal kes|profil kes/.test(firstSearchable)
        ? `${products[0].title} ürününde metal/profil kesme kullanım bilgisi doğrulanıyor. Öne çıkan uygun seçenekleri aşağıda inceleyebilirsiniz.`
        : understanding.useCase === "odun kesme" && /agac|odun|budama|testere/.test(firstSearchable)
          ? `${products[0].title} ürününün site bilgisinde ${understanding.useCase} ile ilgili kullanım doğrulanıyor. Uygun seçenekleri aşağıda inceleyebilirsiniz.`
          : null
    : null
  const answer = understanding.intent === "PRICE_QUERY" && products.length === 1
    ? `${products[0].title} ürününün güncel fiyatı ${products[0].price}.`
    : understanding.intent === "STOCK_QUERY" && products.length === 1
      ? `${products[0].title} şu anda ${products[0].available ? "stokta görünüyor" : "stokta görünmüyor"}.`
      : asksAvailability
        ? `Evet, güncel kataloğumuzda ${ranked.length} ${subject} seçeneği var. Öne çıkan modelleri aşağıda karşılaştırabilirsiniz.`
      : suitabilityAnswer
        ? suitabilityAnswer
      : needsClarification
    ? `Sorunuzu “${subject}” ürünleri olarak yorumladım. Bunu mu demek istediniz? En yakın seçenekleri aşağıda gösteriyorum.`
    : cheapest
    ? `Güncel kataloğa göre “${subject}” aramasındaki en uygun fiyatlı seçenek ${products[0].title}: ${products[0].price}.`
    : expensive
      ? `Güncel kataloğa göre “${subject}” aramasındaki en yüksek fiyatlı seçenek ${products[0].title}: ${products[0].price}.`
      : `Güncel ürün kataloğunda “${subject}” aramanızla eşleşen ${ranked.length} ürün buldum. Öne çıkan seçenekleri aşağıda inceleyebilirsiniz.`

  return {
    answer,
    products,
    link_url: `/magaza?q=${encodeURIComponent(subject)}`,
    link_text: "Tüm Eşleşen Ürünleri Gör",
    source: "catalog" as const,
    evidence: selected.map(({ row }) => ({
      title: row.title,
      url: `/urunler/${row.handle}`,
      facts: compactProductEvidence({
        title: row.title,
        subtitle: row.subtitle,
        description: row.description,
        type: row.type_value,
        brand: row.brand,
        skus: row.skus,
        categories: row.categories,
        tags: row.tags,
        metadata: row.metadata,
      }),
    })),
  }
}
