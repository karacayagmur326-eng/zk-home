export const CHATBOT_INTENTS = [
  "SMALL_TALK",
  "GREETING",
  "THANKS",
  "GOODBYE",
  "ACKNOWLEDGEMENT",
  "GIBBERISH",
  "NON_PRODUCT_CHAT",
  "GENERAL_PRODUCT_QUALITY",
  "PRODUCT_QUALITY",
  "PURCHASE_ADVICE",
  "PRODUCT_DURABILITY",
  "PRODUCT_PERFORMANCE",
  "USE_CASE_SUITABILITY",
  "PRODUCT_DISCOVERY",
  "PRODUCT_COMPARISON",
  "PRODUCT_SPECIFICATION",
  "PRICE_QUERY",
  "STOCK_QUERY",
  "WARRANTY_QUERY",
  "RETURN_QUERY",
  "SHIPPING_QUERY",
  "SITE_GUIDANCE",
  "HOW_TO",
  "TROUBLESHOOTING",
  "ACCESSORY_COMPATIBILITY",
  "CATEGORY_DISCOVERY",
  "BLOG_INFORMATION",
  "TECHNICAL_EXPLANATION",
  "FAQ_INFORMATION",
  "CONTACT_INFORMATION",
  "UNCLEAR_INTENT",
] as const

export type ChatbotIntent = (typeof CHATBOT_INTENTS)[number]
export type ChatbotAnswerType = "CASUAL_RESPONSE" | "DIRECT_FACT" | "PRODUCT_LIST" | "PRODUCT_RECOMMENDATION" | "CATEGORY_RESPONSE" | "CLARIFICATION" | "HOW_TO_RESPONSE" | "FAQ_RESPONSE"
export type ChatbotSourceType = "product" | "category" | "faq" | "corporate" | "blog" | "live_catalog"

export type QueryEntities = {
  brand: string | null
  product: string | null
  productCategory: string | null
  productModel: string | null
  sku: string | null
  voltage: number | null
  batteryCapacity: number | null
  power: number | null
  torque: number | null
  rpm: number | null
  size: { value: number; unit: "mm" | "cm" } | null
  material: string | null
  color: string | null
  features: string[]
  useCase: string | null
  problem: string | null
  comparisonTarget: string | null
  priceIntent: "cheapest" | "highest" | "current" | null
  durabilityIntent: boolean
}

export type QueryUnderstanding = {
  originalQuery: string
  normalizedQuery: string
  correctedQuery: string
  canonicalQuery: string
  intent: ChatbotIntent
  secondaryIntent: ChatbotIntent | null
  entities: QueryEntities
  productCategory: string | null
  productModel: string | null
  features: string[]
  useCase: string | null
  aspect: string | null
  scope: "general" | "category" | "product" | "conversation"
  confidence: number
  intentConfidence: number
  answerType: ChatbotAnswerType
  needsRetrieval: boolean
  preferredSources: ChatbotSourceType[]
  retrievalTerms: string[]
  contextUsed: boolean
  needsClarification: boolean
  catalogHint: CatalogQueryHint | null
}

export type UnderstandingHistoryItem = { role: "user" | "bot"; text: string }

const LOW_INFORMATION_WORDS = new Set([
  "iyi", "guzel", "kotu", "kaliteli", "saglam", "guclu", "ucuz", "pahali", "nasil", "olur", "alinir",
  "urun", "urunler", "alet", "aletler", "mal", "mallar", "makine", "makineler", "var", "yok", "hangi", "hangisi",
  "bana", "sizde", "siz", "mi", "mu", "bir", "icin", "lazim", "goster", "gosterir", "misin", "musun",
])

const QUERY_STOP_WORDS = new Set([
  ...LOW_INFORMATION_WORDS, "bu", "bunu", "su", "ne", "nedir", "kadar", "acaba", "hemen", "daha", "de", "da",
  "mı", "mü", "miyim", "miyiz", "istiyorum", "ariyorum", "alin", "almak", "edebilir", "eder", "edin",
])

const TYPO_MAP: Record<string, string> = {
  nbr: "naber", slm: "selam", napiyon: "napiyon", napion: "napiyon", eyw: "eyvallah", tsk: "tesekkurler",
  matgap: "matkap", matgab: "matkap", sarzli: "sarjli", sarjli: "sarjli", sarz: "sarj", saglammi: "saglam mi",
  iyimi: "iyi mi", alinirmi: "alinir mi", varmı: "var mi", varmi: "var mi", nasill: "nasil", urunlerniz: "urunleriniz",
  iyimsin: "nasilsin", iyimisin: "nasilsin", iyimisiniz: "nasilsin",
  matkaplariniz: "matkaplariniz", mallariniz: "mallariniz", urunleriniz: "urunleriniz", performas: "performans", pmr: "rpm", rmp: "rpm", mpr: "rpm",
  verebilirm: "verebilirim", verebilirmi: "verebilir miyim", olusturabilirm: "olusturabilirim",
}

const CATEGORY_ALIASES: Array<{ category: string; aliases: string[] }> = [
  { category: "matkap", aliases: ["matkap", "matkab", "vidalama", "sarjli matkap", "sarjli vidalama", "darbeli matkap"] },
  { category: "testere", aliases: ["testere", "budama testeresi", "tilki kuyrugu", "dekupaj", "sunsta", "dairesel testere"] },
  { category: "profil kesme", aliases: ["profil kesme", "profil kesim", "profil makinesi"] },
  { category: "kaynak makinesi", aliases: ["kaynak", "kaynak makinesi", "inverter kaynak"] },
  { category: "tırpan", aliases: ["tirpan", "yan tipi tirpan", "benzinli tirpan"] },
  { category: "taşlama", aliases: ["taslama", "spiral", "avuc taslama"] },
  { category: "kırıcı delici", aliases: ["kirici", "hilti", "kirici delici"] },
  { category: "somun sıkma", aliases: ["somun", "somun sikma", "bijon"] },
  { category: "zımpara", aliases: ["zimpara", "zimpara makinesi"] },
  { category: "planya", aliases: ["planya"] },
  { category: "freze", aliases: ["freze"] },
  { category: "kompresör", aliases: ["kompresor", "hava kompresoru"] },
  { category: "boya tabancası", aliases: ["boya tabancasi", "puskurtme tabancasi"] },
  { category: "karıştırıcı", aliases: ["karistirici", "mikser"] },
]

const FEATURE_ALIASES: Array<{ feature: string; aliases: string[] }> = [
  { feature: "metal şanzıman", aliases: ["metal sanziman"] },
  { feature: "çelik şanzıman", aliases: ["celik sanziman"] },
  { feature: "çift akü", aliases: ["cift aku", "iki aku"] },
  { feature: "Li-ion", aliases: ["li ion", "lion", "lityum iyon", "lityum"] },
  { feature: "darbeli", aliases: ["darbeli", "darbe ozelligi"] },
  { feature: "bakır sargılı", aliases: ["bakir sargili", "bakir sargi"] },
  { feature: "kömürlü motor", aliases: ["komurlu", "karbon fircali"] },
  { feature: "kömürsüz motor", aliases: ["komursuz", "brushless"] },
]

const USE_CASE_ALIASES: Array<{ useCase: string; aliases: string[] }> = [
  { useCase: "beton delme", aliases: ["beton del", "betonda", "betona"] },
  { useCase: "duvar delme", aliases: ["duvar del", "duvarda"] },
  { useCase: "demir kesme", aliases: ["demir kes", "metal kes", "profil kes"] },
  { useCase: "odun kesme", aliases: ["odun kes", "agac kes", "dal kes"] },
  { useCase: "mobilya kurma", aliases: ["mobilya kur", "mobilya montaj", "dolap kur"] },
  { useCase: "ev kullanımı", aliases: ["ev icin", "evde kullan"] },
  { useCase: "bahçe bakımı", aliases: ["bahce", "cim bic", "ot bic", "budama"] },
]

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function normalizeQuery(value: unknown) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b\d{1,3}(?:[.\s]\d{3})+\b/g, (match) => match.replace(/[.\s]/g, ""))
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function correctLikelyTypos(normalized: string) {
  return normalized.split(" ").map((token) => {
    if (/\d/.test(token) || /^[a-z]{1,3}-?\d/i.test(token)) return token
    return TYPO_MAP[token] || token
  }).join(" ")
    .replace(/\byuk+\s*sek\b/g, "yuksek")
    .replace(/\s+/g, " ")
    .trim()
}

function includesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern))
}

function findCategory(value: string) {
  return CATEGORY_ALIASES.find(({ aliases }) => includesAny(value, aliases))?.category || null
}

function findUseCase(value: string) {
  return USE_CASE_ALIASES.find(({ aliases }) => includesAny(value, aliases))?.useCase || null
}

function numberBeforeUnit(value: string, units: string[]) {
  const match = value.match(new RegExp(`\\b(\\d+(?:[.,]\\d+)?)\\s*(?:${units.join("|")})\\b`, "i"))
  return match ? Number(match[1].replace(",", ".")) : null
}

function extractEntities(value: string): QueryEntities {
  const explicitCategory = findCategory(value)
  const features = FEATURE_ALIASES.filter(({ aliases }) => includesAny(value, aliases)).map(({ feature }) => feature)
  const modelMatch = value.match(/\b(?:[a-z]{2,}[ -]?)?\d{3,}[a-z0-9-]*\b/i)
  const skuMatch = value.match(/\b(?:sku|stok kodu|urun kodu)\s*[:#-]?\s*([a-z0-9-]{4,})\b/i)
  const sizeMatch = value.match(/\b(\d+(?:[.,]\d+)?)\s*(mm|cm)\b/i)
  const colors = ["sari", "mavi", "kirmizi", "turuncu", "yesil", "siyah"]
  const color = colors.find((item) => new RegExp(`\\b${item}\\b`).test(value)) || null
  const useCase = findUseCase(value)
  const inferredCategory: Record<string, string> = {
    "beton delme": "matkap", "duvar delme": "matkap", "mobilya kurma": "matkap",
    "demir kesme": "profil kesme", "odun kesme": "testere", "bahçe bakımı": "tırpan",
  }
  const category = explicitCategory || (useCase ? inferredCategory[useCase] : null) || null
  return {
    brand: /\bzkhome(?: pro)?\b/.test(value) ? "ZK Home" : null,
    product: category,
    productCategory: category,
    productModel: modelMatch?.[0] || null,
    sku: skuMatch?.[1] || null,
    voltage: numberBeforeUnit(value, ["v", "volt"]),
    batteryCapacity: numberBeforeUnit(value, ["ah", "amper", "amper saat"]),
    power: numberBeforeUnit(value, ["w", "watt"]),
    torque: numberBeforeUnit(value, ["nm"]),
    rpm: numberBeforeUnit(value, ["rpm"]),
    size: sizeMatch ? { value: Number(sizeMatch[1].replace(",", ".")), unit: sizeMatch[2] as "mm" | "cm" } : null,
    material: /metal/.test(value) ? "metal" : /celik/.test(value) ? "çelik" : null,
    color,
    features,
    useCase,
    problem: includesAny(value, [
      "bozul", "calismiyor", "ariza", "sorun", "kiril", "bitiyor", "hizli biter",
      "sarj tutmuyor", "isiniyor", "asinma", "asiri isinma", "duruyor", "kesiliyor", "guc kaybi", "zayifladi",
    ]) ? value : null,
    comparisonTarget: includesAny(value, ["karsilastir", "hangisi daha", "farki ne"]) ? value : null,
    priceIntent: includesAny(value, ["en ucuz", "en uygun", "ekonomik"]) ? "cheapest"
      : includesAny(value, ["en pahali", "en yuksek fiyat"]) ? "highest"
      : includesAny(value, ["kac para", "fiyat", "ne kadar"]) ? "current" : null,
    durabilityIntent: includesAny(value, ["saglam", "dayan", "bozulur", "uzun gider"]),
  }
}

function mergeContext(current: QueryEntities, context: QueryEntities): QueryEntities {
  return {
    ...current,
    brand: current.brand || context.brand,
    product: current.product || context.product,
    productCategory: current.productCategory || context.productCategory,
    productModel: current.productModel || context.productModel,
    sku: current.sku || context.sku,
    voltage: current.voltage ?? context.voltage,
    batteryCapacity: current.batteryCapacity ?? context.batteryCapacity,
    power: current.power ?? context.power,
    torque: current.torque ?? context.torque,
    rpm: current.rpm ?? context.rpm,
    size: current.size || context.size,
    material: current.material || context.material,
    color: current.color || context.color,
    features: uniq([...current.features, ...context.features]),
    useCase: current.useCase || context.useCase,
  }
}

function classifyIntent(value: string, entities: QueryEntities): { primary: ChatbotIntent; secondary: ChatbotIntent | null; aspect: string | null; confidence: number } {
  const genericProductSubject = includesAny(value, ["mal", "mallar", "mallariniz", "urun", "urununuz", "urunler", "urunleriniz", "alet", "aletler", "aletleriniz", "marka", "markaniz"])
  const asksContactNumber = includesAny(value, ["numaraniz", "numaranizi", "telefon numara", "iletisim numara"])
  const quality = includesAny(value, ["iyi mi", "kaliteli", "guzel mi", "guvenilir"]) || (genericProductSubject && /\bnasil\b/.test(value))
  const purchase = includesAny(value, ["alinir", "almaya deger", "para verilir"])
  const suitability = Boolean(entities.useCase) || includesAny(value, ["is gorur", "yeter mi", "yapar mi", "bana yeter"])
  if (/^(selam|merhaba|sa|gunaydin|iyi gunler|iyi aksamlar)$/.test(value)) return { primary: "GREETING", secondary: null, aspect: null, confidence: 0.99 }
  if (/^(naber|ne haber|nasilsin|napiyon)$/.test(value)) return { primary: "SMALL_TALK", secondary: null, aspect: null, confidence: 0.99 }
  if (/^(tesekkur|tesekkurler|sag ol|sagol|eyvallah)$/.test(value)) return { primary: "THANKS", secondary: null, aspect: null, confidence: 0.99 }
  if (/^(gorusuruz|hosca kal|bay bay|bye)$/.test(value)) return { primary: "GOODBYE", secondary: null, aspect: null, confidence: 0.99 }
  if (/^(tamam|ok|okay|anladim|olur)$/.test(value)) return { primary: "ACKNOWLEDGEMENT", secondary: null, aspect: null, confidence: 0.99 }
  if (/^[bcdfghjklmnpqrstvwxyz]{5,}$/.test(value) || /^(asdf|qwe|zx+c|\?+)$/.test(value)) return { primary: "GIBBERISH", secondary: null, aspect: null, confidence: 0.9 }
  if (asksContactNumber || includesAny(value, ["telefon", "iletisim", "eposta", "e posta", "mail", "adres", "whatsapp", "size nasil ulas", "size ulas", "ulasabil", "ulasirim"])) return { primary: "CONTACT_INFORMATION", secondary: null, aspect: "contact", confidence: 0.98 }
  if (includesAny(value, ["garanti", "bozulursa ne", "servis"])) return { primary: "WARRANTY_QUERY", secondary: entities.problem ? "TROUBLESHOOTING" : null, aspect: "warranty", confidence: 0.96 }
  if (includesAny(value, ["iade", "cayma", "geri gonder", "para iadesi"])) return { primary: "RETURN_QUERY", secondary: null, aspect: "return", confidence: 0.98 }
  if (includesAny(value, ["kargo", "teslimat", "kac gunde", "ne zaman gelir"])) return { primary: "SHIPPING_QUERY", secondary: null, aspect: "shipping", confidence: 0.97 }
  if (includesAny(value, [
    "siparis ver", "siparis olustur", "alisveris nasil", "satin alma nasil", "sepete nasil", "sepete ekle",
    "odeme adimi", "uye ol", "kayit ol", "hesap ac", "giris yap", "sifremi unuttum", "sifre yenile",
    "favori", "indirim kodu", "kupon kullan", "siteyi nasil",
  ])) return { primary: "SITE_GUIDANCE", secondary: null, aspect: "site-guidance", confidence: 0.97 }
  if ((/\b(komurlu|karbon fircali)\b/.test(value) && /\b(komursuz|brushless)\b/.test(value))
    || (/\b(komurlu|komursuz|brushless|karbon fircali)\b/.test(value)
      && includesAny(value, ["nedir", "ne demek", "farki", "arasindaki", "hangisi", "iyi mi", "tercih", "hakkinda bilgi", "bilgi ver", "anlat", "acikla"]))) {
    return { primary: "TECHNICAL_EXPLANATION", secondary: null, aspect: "motor-type", confidence: 0.98 }
  }
  if (entities.priceIntent) return { primary: "PRICE_QUERY", secondary: entities.productCategory ? "PRODUCT_DISCOVERY" : null, aspect: "price", confidence: 0.97 }
  if (includesAny(value, ["stokta", "stok", "elinizde", "mevcut mu"])) return { primary: "STOCK_QUERY", secondary: null, aspect: "stock", confidence: 0.97 }
  if (entities.comparisonTarget) return { primary: "PRODUCT_COMPARISON", secondary: entities.durabilityIntent ? "PRODUCT_DURABILITY" : null, aspect: entities.durabilityIntent ? "durability" : "comparison", confidence: 0.91 }
  if (entities.durabilityIntent) return { primary: "PRODUCT_DURABILITY", secondary: entities.productCategory ? "PRODUCT_QUALITY" : null, aspect: "durability", confidence: 0.94 }
  if (suitability) return { primary: "USE_CASE_SUITABILITY", secondary: entities.productCategory ? "PRODUCT_DISCOVERY" : null, aspect: "suitability", confidence: 0.93 }
  if (purchase) return { primary: "PURCHASE_ADVICE", secondary: entities.productCategory ? "PRODUCT_DISCOVERY" : null, aspect: "purchase", confidence: 0.92 }
  if (quality && genericProductSubject && !entities.productCategory) return { primary: "GENERAL_PRODUCT_QUALITY", secondary: null, aspect: "quality", confidence: 0.97 }
  if (quality && entities.productCategory) return { primary: "PRODUCT_QUALITY", secondary: null, aspect: "quality", confidence: 0.94 }
  if (!entities.productCategory && (genericProductSubject || includesAny(value, ["ne var", "bisey", "bir sey"])) && includesAny(value, ["guclu", "performans", "profesyonel", "usta isi", "en yuksek"])) return { primary: "PRODUCT_DISCOVERY", secondary: "PRODUCT_PERFORMANCE", aspect: "performance", confidence: 0.94 }
  if (includesAny(value, ["guclu", "cekisi", "performans", "en yuksek"])) return { primary: "PRODUCT_PERFORMANCE", secondary: entities.productCategory ? "PRODUCT_DISCOVERY" : null, aspect: "performance", confidence: 0.9 }
  if (includesAny(value, ["uyumlu", "uyar mi", "aksesuar", "yedek parca"])) return { primary: "ACCESSORY_COMPATIBILITY", secondary: null, aspect: "compatibility", confidence: 0.92 }
  if (entities.problem) return { primary: "TROUBLESHOOTING", secondary: null, aspect: "problem", confidence: 0.9 }
  if (includesAny(value, ["nasil yap", "nasil kullan", "kurulumu", "ayari"])) return { primary: "HOW_TO", secondary: null, aspect: "how-to", confidence: 0.9 }
  if (includesAny(value, ["kategori", "urun grubu", "neler satiyorsunuz"])) return { primary: "CATEGORY_DISCOVERY", secondary: null, aspect: "category", confidence: 0.94 }
  if (includesAny(value, ["blog", "makale", "rehber"])) return { primary: "BLOG_INFORMATION", secondary: null, aspect: "content", confidence: 0.92 }
  if (includesAny(value, ["hangi marka", "markalariniz", "marka secenekleri"])) return { primary: "FAQ_INFORMATION", secondary: null, aspect: "information", confidence: 0.94 }
  if (/\b(tork|voltaj|amper|watt|rpm|darbe hizi)\s+(nedir|ne demek)\b/.test(value)) return { primary: "TECHNICAL_EXPLANATION", secondary: null, aspect: "education", confidence: 0.96 }
  if (includesAny(value, [
    "sss", "sik sorulan", "kvkk", "kvvk", "kisisel veri", "gizlilik", "cerez", "cookie",
    "sozlesme", "on bilgilendirme", "kullanim kosullari", "hakkimizda", "toptan satis", "kurumsal satis", "bayilik",
  ])) return { primary: "FAQ_INFORMATION", secondary: null, aspect: "information", confidence: 0.9 }
  if (entities.productCategory && includesAny(value, ["var mi", "goster", "lazim", "hangileri", "urunler"])) return { primary: "PRODUCT_DISCOVERY", secondary: entities.useCase ? "USE_CASE_SUITABILITY" : null, aspect: "discovery", confidence: 0.94 }
  if (entities.features.length > 0) return { primary: "PRODUCT_DISCOVERY", secondary: null, aspect: "feature", confidence: 0.88 }
  if (entities.productCategory || entities.voltage || entities.power || entities.rpm || entities.size) return { primary: "PRODUCT_SPECIFICATION", secondary: null, aspect: "specification", confidence: 0.82 }
  return { primary: "UNCLEAR_INTENT", secondary: null, aspect: null, confidence: 0.35 }
}

function chooseSourceTypes(intent: ChatbotIntent): ChatbotSourceType[] {
  switch (intent) {
    case "PRICE_QUERY": case "STOCK_QUERY": return ["live_catalog", "product"]
    case "PRODUCT_DISCOVERY": return ["live_catalog", "product", "category", "faq", "blog"]
    case "PRODUCT_SPECIFICATION": case "PRODUCT_PERFORMANCE": case "PRODUCT_DURABILITY": case "PRODUCT_QUALITY": case "USE_CASE_SUITABILITY": case "PRODUCT_COMPARISON": case "ACCESSORY_COMPATIBILITY": return ["product", "category", "faq", "blog"]
    case "GENERAL_PRODUCT_QUALITY": case "PURCHASE_ADVICE": return ["faq", "corporate", "product", "category"]
    case "HOW_TO": case "TECHNICAL_EXPLANATION": case "TROUBLESHOOTING": return ["blog", "product", "faq"]
    case "WARRANTY_QUERY": return ["faq", "corporate", "product"]
    case "RETURN_QUERY": case "SHIPPING_QUERY": case "SITE_GUIDANCE": case "CONTACT_INFORMATION": case "FAQ_INFORMATION": return ["faq", "corporate"]
    case "CATEGORY_DISCOVERY": return ["category", "product", "blog"]
    case "BLOG_INFORMATION": return ["blog", "product", "faq"]
    default: return ["faq", "category", "product"]
  }
}

function chooseAnswerType(intent: ChatbotIntent, entities: QueryEntities, needsClarification: boolean): ChatbotAnswerType {
  if (["SMALL_TALK", "GREETING", "THANKS", "GOODBYE", "ACKNOWLEDGEMENT", "GIBBERISH", "NON_PRODUCT_CHAT"].includes(intent)) return "CASUAL_RESPONSE"
  if (needsClarification) return "CLARIFICATION"
  if (["PRICE_QUERY", "STOCK_QUERY"].includes(intent)) return "DIRECT_FACT"
  if (["PRODUCT_DISCOVERY", "PRODUCT_SPECIFICATION"].includes(intent)) return entities.productCategory ? "PRODUCT_LIST" : "CATEGORY_RESPONSE"
  if (["PURCHASE_ADVICE", "PRODUCT_COMPARISON", "PRODUCT_PERFORMANCE", "PRODUCT_DURABILITY", "PRODUCT_QUALITY", "USE_CASE_SUITABILITY", "ACCESSORY_COMPATIBILITY"].includes(intent)) return "PRODUCT_RECOMMENDATION"
  if (["HOW_TO", "TECHNICAL_EXPLANATION", "TROUBLESHOOTING", "BLOG_INFORMATION"].includes(intent)) return "HOW_TO_RESPONSE"
  return "FAQ_RESPONSE"
}

function canonicalTerms(intent: ChatbotIntent, entities: QueryEntities) {
  const terms = ["zkhome", "pro"]
  if (entities.productCategory) terms.push(...normalizeQuery(entities.productCategory).split(" "))
  if (entities.voltage != null) terms.push(String(entities.voltage), "v")
  if (entities.batteryCapacity != null) terms.push(String(entities.batteryCapacity), "ah")
  if (entities.power != null) terms.push(String(entities.power), "w")
  if (entities.torque != null) terms.push(String(entities.torque), "nm")
  if (entities.rpm != null) terms.push(String(entities.rpm), "rpm")
  if (entities.size) terms.push(String(entities.size.value), entities.size.unit)
  if (entities.color) terms.push(entities.color)
  terms.push(...entities.features.flatMap((item) => normalizeQuery(item).split(" ")))
  if (entities.useCase) terms.push(...normalizeQuery(entities.useCase).split(" "))
  const intentTerms: Partial<Record<ChatbotIntent, string[]>> = {
    GENERAL_PRODUCT_QUALITY: ["urun", "kalite", "guvenilirlik", "garanti"],
    PRODUCT_QUALITY: ["kalite", "teknik", "ozellik", "garanti"],
    PURCHASE_ADVICE: ["kullanim", "uygunluk", "teknik", "ozellik"],
    PRODUCT_DURABILITY: ["dayaniklilik", "sanziman", "motor", "malzeme", "garanti"],
    PRODUCT_PERFORMANCE: ["performans", "guc", "voltaj", "watt", "tork"],
    USE_CASE_SUITABILITY: ["kullanim", "uygunluk", "ozellik"],
    WARRANTY_QUERY: ["garanti", "servis"], RETURN_QUERY: ["iade", "cayma"], SHIPPING_QUERY: ["kargo", "teslimat"],
    SITE_GUIDANCE: ["site", "siparis", "sepet", "hesap", "odeme"],
    CONTACT_INFORMATION: ["iletisim", "telefon", "eposta"], CATEGORY_DISCOVERY: ["kategori"],
  }
  terms.push(...(intentTerms[intent] || []))
  return uniq(terms.filter((term) => !QUERY_STOP_WORDS.has(term)))
}

export function understandQuery(
  message: string,
  history: UnderstandingHistoryItem[] = [],
  catalogHint: CatalogQueryHint | null = null
): QueryUnderstanding {
  const normalizedQuery = normalizeQuery(message)
  const correctedQuery = correctLikelyTypos(normalizedQuery)
  const explicitProductCategory = findCategory(correctedQuery)
  let entities = extractEntities(correctedQuery)
  let effectiveCatalogHint = catalogHint
  if (explicitProductCategory && catalogHint?.category) {
    const specificStaticTerms = normalizeQuery(explicitProductCategory)
      .split(" ")
      .filter((term) => term.length > 3 && !["kesme", "makinesi", "urun"].includes(term))
    const dynamicName = normalizeQuery(`${catalogHint.category.name} ${catalogHint.category.handle}`)
    if (specificStaticTerms.length && !specificStaticTerms.some((term) => dynamicName.includes(term))) {
      effectiveCatalogHint = null
    }
  }
  if (!explicitProductCategory && effectiveCatalogHint?.category && effectiveCatalogHint.confidence >= 0.58) {
    entities = {
      ...entities,
      product: effectiveCatalogHint.category.name,
      productCategory: effectiveCatalogHint.category.name,
    }
  }
  const elliptical = !effectiveCatalogHint
    && /\b(bu|bunu|bunlar|hangisi|is gorur|kac para|stokta|saglam|peki|ya)\b/.test(correctedQuery)
  let contextUsed = false
  if (elliptical) {
    const previousUser = [...history].reverse().find((item) => item.role === "user" && normalizeQuery(item.text) !== normalizedQuery)
    if (previousUser) {
      const contextEntities = extractEntities(correctLikelyTypos(normalizeQuery(previousUser.text)))
      const before = JSON.stringify(entities)
      entities = mergeContext(entities, contextEntities)
      contextUsed = before !== JSON.stringify(entities)
    }
  }
  let classification = classifyIntent(correctedQuery, entities)
  if (effectiveCatalogHint && classification.primary === "UNCLEAR_INTENT") {
    classification = { primary: "PRODUCT_DISCOVERY", secondary: null, aspect: "discovery", confidence: effectiveCatalogHint.confidence }
  }
  const descriptiveRetrieval = ["HOW_TO", "TROUBLESHOOTING", "TECHNICAL_EXPLANATION", "BLOG_INFORMATION"].includes(classification.primary)
  const retrievalTerms = uniq([
    ...canonicalTerms(classification.primary, entities),
    ...(descriptiveRetrieval
      ? correctedQuery.split(" ").filter((term) => term.length > 2 && !QUERY_STOP_WORDS.has(term) && !isLowInformationTerm(term))
      : []),
  ])
  const needsSubject = ["USE_CASE_SUITABILITY", "PRODUCT_COMPARISON", "PRODUCT_PERFORMANCE", "PRODUCT_DISCOVERY", "PRICE_QUERY", "STOCK_QUERY", "PRODUCT_DURABILITY"].includes(classification.primary)
  const needsClarification = needsSubject && !entities.productCategory && !entities.productModel && !entities.sku && !entities.features.length && !effectiveCatalogHint
  const noRetrievalIntents: ChatbotIntent[] = ["SMALL_TALK", "GREETING", "THANKS", "GOODBYE", "ACKNOWLEDGEMENT", "GIBBERISH", "NON_PRODUCT_CHAT"]
  const needsRetrieval = !noRetrievalIntents.includes(classification.primary)
    && !(classification.primary === "UNCLEAR_INTENT" && classification.confidence < 0.6 && !entities.productCategory && !entities.productModel && !entities.sku)
  const answerType = chooseAnswerType(classification.primary, entities, needsClarification)
  const scope = contextUsed ? "conversation" : entities.productModel || entities.sku ? "product" : entities.productCategory ? "category" : "general"
  return {
    originalQuery: message,
    normalizedQuery,
    correctedQuery,
    canonicalQuery: retrievalTerms.join(" "),
    intent: classification.primary,
    secondaryIntent: classification.secondary,
    entities,
    productCategory: entities.productCategory,
    productModel: entities.productModel,
    features: entities.features,
    useCase: entities.useCase,
    aspect: classification.aspect,
    scope,
    confidence: contextUsed ? Math.min(0.98, classification.confidence + 0.03) : classification.confidence,
    intentConfidence: contextUsed ? Math.min(0.98, classification.confidence + 0.03) : classification.confidence,
    answerType,
    needsRetrieval,
    preferredSources: chooseSourceTypes(classification.primary),
    retrievalTerms,
    contextUsed,
    needsClarification,
    catalogHint: effectiveCatalogHint,
  }
}

export function isLowInformationTerm(term: string) {
  return LOW_INFORMATION_WORDS.has(normalizeQuery(term))
}
import type { CatalogQueryHint } from "./taxonomy-core"
