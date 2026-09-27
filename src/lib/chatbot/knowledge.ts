import "server-only"

import { query } from "@lib/admin/db"
import { listStoreProducts } from "@lib/commerce/repository"
import { formatTryPrice } from "@lib/util/money"
import {
  defaultArticles,
  defaultBlogPageContent,
  defaultFaqItems,
  defaultFaqPageContent,
} from "@lib/content/knowledge-pages"
import { defaultServicePageData } from "@lib/content/service-page"
import { ChatbotSettings } from "./config"
import { normalizeChatbotText } from "./settings"
import { ChatbotSourceType, isLowInformationTerm, QueryUnderstanding, understandQuery } from "./understanding"
import { compactProductEvidence } from "./product-context"

type KnowledgeEntry = {
  id: string
  title: string
  text: string
  url: string
  priority: number
  contentType: Exclude<ChatbotSourceType, "product" | "live_catalog">
}

type KnowledgeRow = {
  id: string
  title: string
  content: unknown
  url: string
}

const PUBLIC_SETTING_ROUTES: Record<string, { title: string; url: string }> = {
  delivery_returns_info: { title: "Teslimat, kargo, iade ve değişim", url: "/teslimat-ve-iade" },
  wholesale_info: { title: "Toptan satış ve kurumsal satış", url: "/toptan-ve-kurumsal-satis" },
  brands_page_info: { title: "Markalar", url: "/markalarimiz" },
}

const PAGE_TITLES: Record<string, string> = {
  sss: "Sık Sorulan Sorular",
  blog: "Blog ve ürün rehberleri",
  iletisim: "İletişim",
  hakkimizda: "Hakkımızda",
  "teslimat-ve-iade": "Teslimat, kargo, iade ve değişim",
  "garanti-ve-teknik-servis": "Garanti ve teknik servis",
  "kvkk-aydinlatma-metni": "KVKK Aydınlatma Metni",
  "gizlilik-politikasi": "Gizlilik Politikası",
  "cerez-politikasi": "Çerez Politikası",
  "mesafeli-satis-sozlesmesi": "Mesafeli Satış Sözleşmesi",
  "on-bilgilendirme-formu": "Ön Bilgilendirme Formu",
  "kullanim-kosullari": "Kullanım Koşulları",
}

const STOP_WORDS = new Set([
  "acaba", "ama", "bana", "ben", "beni", "bende", "bir", "bize", "bizim", "bu", "bunu", "da", "de", "diye",
  "icin", "ile", "ilgili", "ise", "mi", "miyim", "misin", "misiniz", "mu", "musun", "musunuz", "ne", "nasil",
  "nedir", "neler", "nerede", "olan", "olarak", "olur", "sana", "seklinde", "sey", "sitede", "sitenizde", "siz",
  "sizde", "var", "varmi", "ve", "veya", "ya", "yani", "yok", "yokmu",
])

const KNOWLEDGE_CATEGORY_ALIASES: Record<string, string[]> = {
  matkap: ["matkap", "vidalama"],
  testere: ["testere", "budama", "dekupaj"],
  "profil kesme": ["profil kesme", "metal kesme"],
  "kaynak makinesi": ["kaynak"],
  "tırpan": ["tirpan"],
  "taşlama": ["taslama", "spiral"],
  "kırıcı delici": ["kirici", "delici", "hilti"],
}

function flattenPublicContent(value: unknown, output: string[] = []): string[] {
  if (typeof value === "string") {
    const cleaned = value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim()
    if (cleaned && !/^https?:\/\//i.test(cleaned) && !/^\/brand\//i.test(cleaned)) output.push(cleaned)
  } else if (Array.isArray(value)) {
    value.forEach((item) => flattenPublicContent(item, output))
  } else if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !/(image|thumbnail|icon|password|secret|token|api.?key|smtp)/i.test(key))
      .forEach(([, item]) => flattenPublicContent(item, output))
  }
  return output
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0]
    previous[0] = i
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j]
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return previous[right.length]
}

function tokenMatches(term: string, candidate: string) {
  if (term === candidate) return 1
  if (term.length >= 4 && (candidate.startsWith(term) || term.startsWith(candidate))) return 0.82
  const tolerance = term.length >= 8 ? 2 : term.length >= 5 ? 1 : 0
  if (tolerance && Math.abs(term.length - candidate.length) <= tolerance && editDistance(term, candidate) <= tolerance) return 0.62
  return 0
}

function meaningfulTokens(value: string) {
  return normalizeChatbotText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token) && !isLowInformationTerm(token))
}

function splitIntoPassages(text: string) {
  const clean = text.replace(/\s+/g, " ").trim()
  if (!clean) return []
  const sentences = clean.split(/(?<=[.!?])\s+|\s*[|•]\s*/).filter(Boolean)
  const passages: string[] = []
  let current = ""
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > 620) {
      passages.push(current)
      current = ""
    }
    current = `${current} ${sentence}`.trim()
  }
  if (current) passages.push(current)
  return passages.length ? passages : [clean.slice(0, 620)]
}

function passageIntentSignal(passage: string, intent: string) {
  const value = normalizeChatbotText(passage)
  const signals = intent === "TROUBLESHOOTING"
    ? ["yol acar", "neden olur", "tuken", "bitir", "isin", "asiri", "sarj", "zayif", "korel", "tikan"]
    : intent === "HOW_TO"
      ? ["adim", "once", "ardindan", "ayarla", "kullanin", "kontrol edin"]
      : []
  return signals.reduce((score, signal) => score + (value.includes(signal) ? 1.25 : 0), 0)
}

function selectAnswerSentences(
  ranked: Array<{ passage: string; entry: KnowledgeEntry }>,
  terms: string[],
  intent: string,
) {
  const promotional = /ürünü incele|tüm ürünleri|kategorideki ürünleri|tavsiye edilen model|konusunda merak edilen tüm|genel bakış ve teknik çalışma prensibi|\b\d+\s*(?:kat|%|°)|yarıya iner|tamamen engeller|tarihe karış/i
  const candidates = ranked.slice(0, 20).flatMap((item) =>
    item.passage
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.replace(/\s+/g, " ").trim())
      .filter((sentence) => sentence.length >= 35 && sentence.length <= 340 && !sentence.includes("?") && !promotional.test(sentence))
      .map((sentence) => {
        const sentenceTokens = meaningfulTokens(sentence)
        const queryMatches = terms.reduce((score, term) =>
          score + Math.max(0, ...sentenceTokens.map((candidate) => tokenMatches(term, candidate))), 0)
        const intentSignal = passageIntentSignal(sentence, intent)
        return { sentence, score: queryMatches * 1.5 + intentSignal * 2, intentSignal, queryMatches }
      }) || [],
  )
  const requiresIntentSignal = ["TROUBLESHOOTING", "HOW_TO"].includes(intent)
  return Array.from(new Map(candidates
    .filter((item) => item.score > 0 && (!requiresIntentSignal || (item.intentSignal > 0 && item.queryMatches > 0)))
    .sort((left, right) => right.score - left.score)
    .map((item) => [normalizeChatbotText(item.sentence), item])).values())
    .slice(0, 2)
    .map((item) => item.sentence)
    .join(" ")
}

const TECHNICAL_EXPLANATIONS: Record<string, string> = {
  tork: "Tork, aletin ürettiği döndürme kuvvetidir ve Nm ile ifade edilir. Vidalama, somun sıkma veya malzemeye karşı direnç arttıkça gereken tork değişir; tek başına yüksek Nm her iş için doğru ürün anlamına gelmez.",
  voltaj: "Voltaj, elektrikli veya akülü aletin çalışma gerilimini gösterir. Daha yüksek voltaj tek başına daha iyi performans garantisi değildir; motor, tork, akü kapasitesi ve yapılacak iş birlikte değerlendirilmelidir.",
  amper: "Akülerde Ah değeri enerji kapasitesini ve yaklaşık çalışma süresini karşılaştırmaya yardımcı olur. Ah yükseldikçe çalışma süresi artabilir; ancak ağırlık, motor tüketimi ve kullanım biçimi de sonucu etkiler.",
  watt: "Watt, elektrikli aletin güç tüketimiyle ilgili teknik değerdir. Kesme veya delme performansını değerlendirirken watt değerinin yanında devir, tork ve ürünün kullanım amacı da kontrol edilmelidir.",
  rpm: "RPM, motorun veya milin dakikadaki dönüş sayısını gösterir. Yüksek devir her malzeme için uygun değildir; kullanılacak uç, disk, malzeme ve tork ihtiyacıyla birlikte değerlendirilmelidir.",
}

function inferContentType(row: KnowledgeRow): KnowledgeEntry["contentType"] {
  if (row.id.startsWith("category:")) return "category"
  if (row.id.startsWith("article:") || row.url.startsWith("/blog")) return "blog"
  if (row.id.startsWith("faq:") || row.id === "sss" || row.url === "/sss") return "faq"
  return "corporate"
}

function toEntry(row: KnowledgeRow, priority = 1, contentType = inferContentType(row)): KnowledgeEntry {
  return {
    id: row.id,
    title: row.title,
    text: flattenPublicContent(row.content).join(" "),
    url: row.url,
    priority,
    contentType,
  }
}

let knowledgeSnapshot: { entries: KnowledgeEntry[]; expiresAt: number } | null = null

async function findLiveProductsByVisibleTerm(term: string, limit: number) {
  const result = await listStoreProducts({
    q: term,
    status: "published",
    limit: Math.min(Math.max(limit, 1), 8),
  }).catch(() => ({ products: [], count: 0 }))

  return result.products.map((product: any) => {
    const variant = product.variants?.[0]
    const rawPrice =
      variant?.calculated_price?.calculated_amount ??
      variant?.prices?.[0]?.amount ??
      0
    const categories = (product.categories || [])
      .map((item: any) => item?.name)
      .filter(Boolean)
      .join(", ")
    const tags = (product.tags || [])
      .map((item: any) => item?.value)
      .filter(Boolean)
      .join(", ")

    return {
      title: product.title,
      url: `/urunler/${product.handle}`,
      price: formatTryPrice(Number(rawPrice) / 100),
      thumbnail: product.thumbnail || variant?.thumbnail || "",
      available: Boolean(
        product.variants?.some(
          (item: any) => Number(item?.inventory_quantity || 0) > 0 || item?.allow_backorder,
        ),
      ),
      brand: product.collection?.title || undefined,
      model: variant?.sku || variant?.title || undefined,
      facts: compactProductEvidence({
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        type: product.type?.value,
        brand: product.collection?.title,
        skus: variant?.sku,
        categories,
        tags,
        metadata: product.metadata,
      }),
    }
  })
}

async function getPublicKnowledgeEntries() {
  if (knowledgeSnapshot && knowledgeSnapshot.expiresAt > Date.now()) return knowledgeSnapshot.entries

  const [pages, posts, categories, collections, campaigns, menus, settings] = await Promise.all([
    query<KnowledgeRow>(
      `SELECT handle AS id, COALESCE(content->>'title', handle) AS title, content,
        CASE WHEN handle='kvkk-aydinlatma-metni' THEN '/kvkk' ELSE '/' || handle END AS url
       FROM content_pages ORDER BY updated_at DESC`
    ).catch(() => []),
    query<KnowledgeRow>(
      `SELECT id::text AS id, title, jsonb_build_object('title',title,'excerpt',excerpt,'content',content) AS content,
        '/blog/' || slug AS url FROM blog_posts WHERE status='published' ORDER BY published_at DESC NULLS LAST`
    ).catch(() => []),
    query<KnowledgeRow>(
      `SELECT 'category:' || id::text AS id, name AS title,
        jsonb_build_object('name',name,'description',description,'metadata',metadata) AS content,
        '/kategoriler/' || handle AS url FROM store_category WHERE active=TRUE ORDER BY rank,name`
    ).catch(() => []),
    query<KnowledgeRow>(
      `SELECT id::text AS id, title, jsonb_build_object('title',title,'metadata',metadata) AS content,
        '/koleksiyonlarim' AS url FROM store_collection ORDER BY updated_at DESC`
    ).catch(() => []),
    query<KnowledgeRow>(
      `SELECT id::text AS id, name AS title,
        jsonb_build_object('name',name,'description',description,'type',type,'discount_type',discount_type,
          'discount_value',discount_value,'min_subtotal',min_subtotal,'starts_at',starts_at,'ends_at',ends_at,'metadata',metadata) AS content,
        '/magaza' AS url FROM store_campaign
       WHERE status IN ('active','published') AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())`
    ).catch(() => []),
    query<KnowledgeRow>(
      `SELECT id::text AS id, name AS title,
        jsonb_build_object('name',name,'handle',handle,'location',location,'items',items) AS content,
        '/' AS url FROM navigation_menu ORDER BY updated_at DESC`
    ).catch(() => []),
    query<{ key: string; value: unknown }>(
      `SELECT key,value FROM store_settings WHERE key = ANY($1::text[])`,
      [Object.keys(PUBLIC_SETTING_ROUTES)]
    ).catch(() => []),
  ])

  const entries: KnowledgeEntry[] = [
    ...pages.map((row) => toEntry({ ...row, title: PAGE_TITLES[row.id] || row.title }, 5)),
    ...posts.map((row) => toEntry(row, 2, "blog")),
    ...categories.map((row) => toEntry(row, 4, "category")),
    ...collections.map((row) => toEntry(row, 3)),
    ...campaigns.map((row) => toEntry(row, 4)),
    ...menus.map((row) => toEntry(row, 2)),
    ...settings.map((row) => toEntry({
      id: `setting:${row.key}`,
      title: PUBLIC_SETTING_ROUTES[row.key].title,
      content: row.value,
      url: PUBLIC_SETTING_ROUTES[row.key].url,
    }, 5)),
  ]

  // Veritabanı henüz oluşturulmamış veya ilgili içerik silinmiş olsa bile temel
  // ziyaretçi sayfaları chatbot bilgisinden kaybolmasın.
  if (!pages.some((row) => row.id === "sss")) {
    entries.push(...defaultFaqItems.filter((item) => item.active).map((item) => ({
      id: `faq:${item.id}`, title: item.question, text: `${item.question} ${item.answer}`, url: item.linkUrl || "/sss", priority: 5,
      contentType: "faq" as const,
    })))
    entries.push(toEntry({ id: "fallback:sss", title: "Sık Sorulan Sorular", content: defaultFaqPageContent, url: "/sss" }, 4))
  }
  if (!pages.some((row) => row.id === "blog")) {
    entries.push(...defaultArticles.filter((item) => item.active).map((item) => ({
      id: `article:${item.id}`, title: item.title, text: `${item.title} ${item.excerpt} ${flattenPublicContent(item.content).join(" ")}`,
      url: `/blog/${item.slug}`, priority: 2, contentType: "blog" as const,
    })))
    entries.push(toEntry({ id: "fallback:blog", title: "Blog ve ürün rehberleri", content: defaultBlogPageContent, url: "/blog" }, 2))
  }
  if (!pages.some((row) => row.id === "garanti-ve-teknik-servis")) {
    entries.push(toEntry({ id: "fallback:service", title: "Garanti ve teknik servis", content: defaultServicePageData, url: "/garanti-ve-teknik-servis" }, 5))
  }

  knowledgeSnapshot = {
    entries: entries.filter((entry) => entry.text.trim()),
    expiresAt: Date.now() + 120_000,
  }
  return knowledgeSnapshot.entries
}

export async function searchPublicSiteKnowledge(message: string, settings: ChatbotSettings, providedUnderstanding?: QueryUnderstanding) {
  if (!settings.page_search_enabled) return null
  const understanding = providedUnderstanding || understandQuery(message)
  const terms = understanding.retrievalTerms.filter((term) => !isLowInformationTerm(term))
  if (!terms.length) return null

  const allEntries = await getPublicKnowledgeEntries()
  const asksBrushedMotor = /\b(komurlu|karbon fircali)\b/.test(understanding.correctedQuery)
  const asksBrushlessMotor = /\b(komursuz|brushless)\b/.test(understanding.correctedQuery)
  if (understanding.intent === "TECHNICAL_EXPLANATION" && (asksBrushedMotor || asksBrushlessMotor)) {
    const visibleProductTerm = asksBrushlessMotor && !asksBrushedMotor
      ? "kömürsüz"
      : asksBrushedMotor && !asksBrushlessMotor
        ? "kömürlü"
        : "matkap"
    const products = await findLiveProductsByVisibleTerm(
      visibleProductTerm,
      settings.max_product_results,
    )
    const answer = asksBrushedMotor && asksBrushlessMotor
      ? "**Kısa cevap: Yoğun ve uzun süreli kullanımda kömürsüz motor genellikle daha avantajlıdır; bütçe odaklı ve ara sıra kullanımda kömürlü model de ihtiyacı karşılayabilir.**\n\nKömürlü motor, elektrik akımını motora aktarmak için zamanla aşınabilen karbon fırçalar kullanır. Kömürsüz motorda bu fırçalar yoktur; bu nedenle bakım ihtiyacı daha düşüktür ve enerji daha verimli kullanılabilir. Yine de motor tipi tek başına performans ölçüsü değildir; voltaj, tork, akü kapasitesi ve yapacağınız iş de birlikte değerlendirilmelidir."
      : asksBrushlessMotor
        ? "**Kömürsüz matkap, motorunda karbon fırça kullanmayan elektronik kontrollü bir matkap türüdür.**\n\nKömür değişimi gerektirmemesi, daha düşük bakım ihtiyacı ve akü enerjisini daha verimli kullanabilmesi başlıca avantajlarıdır. Gerçek güç ve işe uygunluk için motor tipinin yanında voltaj, tork ve akü kapasitesine de bakılmalıdır."
        : "**Kömürlü matkap, motorunda elektrik akımını iletmek için karbon fırçalar kullanan geleneksel bir matkap türüdür.**\n\nBu fırçalar kullanım süresine bağlı olarak aşınabilir ve ileride değişim gerektirebilir. Kömürlü modeller bütçe açısından avantajlı olabilir; ancak seçim yaparken voltaj, tork, akü kapasitesi ve kullanım sıklığını da değerlendirmek gerekir."
    return {
      answer,
      products,
      link_url: products.length
        ? `/magaza?q=${encodeURIComponent(visibleProductTerm)}`
        : "/sss",
      link_text: products.length
        ? `${visibleProductTerm.charAt(0).toLocaleUpperCase("tr-TR")}${visibleProductTerm.slice(1)} Matkapları İncele`
        : "Kömürlü ve Kömürsüz Motor Farkını İncele",
      source: "technical_explanation" as const,
      evidence: [
        ...defaultFaqItems
        .filter((item) => /kömürlü|kömürsüz/i.test(`${item.question} ${item.answer}`))
        .slice(0, 2)
        .map((item) => ({ title: item.question, text: item.answer, url: "/sss", contentType: "faq" as const })),
        ...products.map((product) => ({
          title: product.title,
          text: product.facts.join("; "),
          url: product.url,
          contentType: "product" as const,
        })),
      ],
      knowledge_sources: [
        { title: "Sık Sorulan Sorular", url: "/sss" },
        ...products.map((product) => ({ title: product.title, url: product.url })),
      ],
    }
  }
  const allowedSources = new Set(understanding.preferredSources)
  const categoryToken = understanding.productCategory ? normalizeChatbotText(understanding.productCategory) : ""
  const categoryTerms = categoryToken
    ? (KNOWLEDGE_CATEGORY_ALIASES[understanding.productCategory || ""] || categoryToken.split(" "))
        .map(normalizeChatbotText)
        .filter(Boolean)
    : []
  const entries = allEntries.filter((entry) => {
    if (!allowedSources.has(entry.contentType)) return false
    if (entry.contentType === "blog" && ["PRODUCT_DISCOVERY", "PRODUCT_PERFORMANCE", "PRODUCT_QUALITY", "PRODUCT_DURABILITY"].includes(understanding.intent)) return false
    if (!categoryToken || !["category", "blog"].includes(entry.contentType)) return true
    // Blog gövdesindeki menü, ilgili-yazı ve SEO çapraz bağlantıları tek başına
    // kategori kanıtı değildir. Kategori ilgisini başlık ve giriş bağlamından kur.
    const identity = normalizeChatbotText(`${entry.title} ${entry.text.slice(0, 700)}`)
    return categoryTerms.some((term) => identity.includes(term))
  })
  if (understanding.intent === "CATEGORY_DISCOVERY") {
    const categoryEntries = Array.from(new Map(entries
      .filter((entry) => entry.id.startsWith("category:"))
      .map((entry) => [normalizeChatbotText(entry.title), entry])).values())
    if (categoryEntries.length) {
      return {
        answer: `Ürün kategorilerimiz: ${categoryEntries.map((entry) => entry.title).join(", ")}.`,
        link_url: "/magaza",
        link_text: "Tüm Ürünleri ve Kategorileri İncele",
        source: "site_categories" as const,
        knowledge_sources: categoryEntries.slice(0, 12).map((entry) => ({ title: entry.title, url: entry.url })),
      }
    }
  }
  const ranked = entries.flatMap((entry) => {
    const titleTokens = meaningfulTokens(entry.title)
    return splitIntoPassages(entry.text).map((passage) => {
      const passageTokens = meaningfulTokens(passage)
      let matchedTerms = 0
      let bodyMatchedTerms = 0
      let score = 0
      for (const term of terms) {
        const titleMatch = Math.max(0, ...titleTokens.map((candidate) => tokenMatches(term, candidate)))
        const bodyMatch = Math.max(0, ...passageTokens.map((candidate) => tokenMatches(term, candidate)))
        const match = Math.max(titleMatch, bodyMatch)
        if (!match) continue
        matchedTerms += 1
        if (bodyMatch) bodyMatchedTerms += 1
        const entityMatch = categoryTerms.some((token) => titleTokens.includes(token))
        // Başlık, doğru yazıyı seçmeye yardım eder; hangi paragrafın cevap
        // verdiğine tek başına karar vermez. Paragraftaki gerçek eşleşme ağır basar.
        score += bodyMatch ? bodyMatch * 3.5 : titleMatch * 1.25
        if (entityMatch) score += 0.75
      }
      const coverage = matchedTerms / terms.length
      const sourceRank = understanding.preferredSources.indexOf(entry.contentType)
      const sourceBoost = sourceRank < 0 ? 0 : Math.max(0, 3 - sourceRank) * 1.5
      return {
        entry,
        passage,
        matchedTerms,
        bodyMatchedTerms,
        coverage,
        score: score + passageIntentSignal(passage, understanding.intent) + entry.priority * 0.3 + sourceBoost,
      }
    })
  })
    .filter((item) => item.matchedTerms > 0 && item.score >= 3.5 && (item.coverage >= 0.25 || item.matchedTerms >= 2))
    .sort((left, right) => right.score - left.score || right.bodyMatchedTerms - left.bodyMatchedTerms || right.coverage - left.coverage)

  const maxChunks = understanding.intent === "PRODUCT_COMPARISON" ? 6 : understanding.scope === "general" ? 3 : 4
  const relevanceFloor = (ranked[0]?.score || 0) * 0.72
  const selected = Array.from(new Map(ranked
    .filter((item) => item.score >= relevanceFloor)
    .map((item) => [`${item.entry.url}:${item.passage.slice(0, 80)}`, item])).values()).slice(0, maxChunks)
  if (!selected.length) return null

  // AI sağlayıcısı kullanılamadığında da bütün sayfaları ziyaretçiye dökmeyelim.
  // İlk ve en güçlü kanıt kısa yerel yanıt olur; diğer seçilmiş parçalar yalnızca
  // grounded cevap üreticisine kanıt olarak iletilir.
  const answerRanked = understanding.intent === "PRODUCT_COMPARISON"
    ? ranked
    : ranked.filter((item) => item.entry.url === ranked[0].entry.url)
  const targetedSentences = selectAnswerSentences(answerRanked, terms, understanding.intent)
  const evidenceSentences = targetedSentences || selected[0].passage
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ") || selected[0].passage.slice(0, 320)
  const technicalConcept = understanding.intent === "TECHNICAL_EXPLANATION"
    ? Object.keys(TECHNICAL_EXPLANATIONS).find((concept) => understanding.correctedQuery.includes(concept))
    : undefined
  const technicalAnswer = technicalConcept && selected.some((item) => normalizeChatbotText(`${item.entry.title} ${item.passage}`).includes(technicalConcept))
    ? TECHNICAL_EXPLANATIONS[technicalConcept]
    : ""
  const answer = technicalAnswer || (understanding.intent === "BLOG_INFORMATION"
    ? `${selected[0].entry.title} içeriğini buldum. İsterseniz ilgili rehberi açabilirsiniz.`
    : `Sitede doğrulayabildiğim bilgiye göre ${evidenceSentences.charAt(0).toLocaleLowerCase("tr-TR")}${evidenceSentences.slice(1)}`)
  const sourceItems = understanding.intent === "PRODUCT_COMPARISON"
    ? selected
    : selected.filter((item) => item.entry.url === selected[0].entry.url)
  const knowledgeSources = Array.from(new Map(
    sourceItems.map((item) => [item.entry.url, { title: item.entry.title, url: item.entry.url }]),
  ).values())
  return {
    answer,
    link_url: selected[0].entry.url,
    link_text: technicalConcept ? `${technicalConcept.toLocaleUpperCase("tr-TR")} Rehberini İncele` : `${selected[0].entry.title} Sayfasını İncele`,
    source: "site_knowledge" as const,
    evidence: selected.map((item) => ({ title: item.entry.title, text: item.passage.slice(0, 420), url: item.entry.url, contentType: item.entry.contentType })),
    knowledge_sources: knowledgeSources,
  }
}
