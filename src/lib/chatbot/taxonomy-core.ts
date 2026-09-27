export type CatalogTaxonomyCategory = {
  id: string
  name: string
  handle: string
  description?: string | null
  parent_id?: string | null
  metadata?: Record<string, unknown> | null
}

export type CatalogTaxonomyTag = {
  id: string
  value: string
  metadata?: Record<string, unknown> | null
}

export type CatalogCategoryHint = {
  id: string
  name: string
  handle: string
  parentId: string | null
}

export type CatalogQueryHint = {
  category: CatalogCategoryHint | null
  categoryIds: string[]
  tagIds: string[]
  matchedTerms: string[]
  childCategories: CatalogCategoryHint[]
  confidence: number
}

const QUERY_STOP_WORDS = new Set([
  "acaba", "bana", "bize", "bir", "bu", "icin", "ile", "mi", "misin", "misiniz", "mu", "musun",
  "musunuz", "ne", "neler", "nelerdir", "nedir", "oner", "onerir", "onerirmisin", "onerirmisiniz", "olan",
  "olarak", "urun", "urunler", "urunleri", "urunleriniz", "urunlerinizi", "var", "varmi", "yok", "goster",
  "gosterir", "gosterirmisin", "hangisi", "hangi", "istiyorum", "ariyorum", "secenek", "secenekleri",
])

// Bunlar kategori listesi değil, günlük dil ile katalog adları arasındaki
// kavramsal köprülerdir. Asıl kategori ve etiket kaynağı her zaman veritabanıdır.
const CONCEPT_EXPANSIONS: Record<string, string[]> = {
  bahce: ["budama", "cim", "tirpan", "yaprak", "ufleme"],
  temizlik: ["temizleyici", "yikama", "buharli", "ufleme"],
  olcum: ["olcer", "metre", "lazer", "hizalama"],
  kesim: ["kesme", "testere", "makas"],
  kesme: ["kesim", "testere", "makas"],
  zimpara: ["yuzey", "taslama", "polisaj"],
  sarjli: ["akulu", "aku"],
  akulu: ["sarjli", "aku"],
}

function normalizeQuery(value: unknown) {
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

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function tokens(value: unknown) {
  return normalizeQuery(value)
    .split(" ")
    .filter((token) => token.length > 2 && !QUERY_STOP_WORDS.has(token))
}

function tokenSimilarity(left: string, right: string) {
  if (left === right) return 1
  if (left.length >= 5 && right.length >= 5 && (left.startsWith(right) || right.startsWith(left))) return 0.82
  return 0
}

function toHint(category: CatalogTaxonomyCategory): CatalogCategoryHint {
  return {
    id: category.id,
    name: category.name,
    handle: category.handle,
    parentId: category.parent_id || null,
  }
}

export function buildCatalogQueryHint(
  message: string,
  categories: CatalogTaxonomyCategory[],
  tags: CatalogTaxonomyTag[]
): CatalogQueryHint | null {
  const normalized = normalizeQuery(message)
  const queryTerms = uniq(tokens(normalized))
  if (!queryTerms.length) return null

  const expandedTerms = uniq(queryTerms.flatMap((term) => CONCEPT_EXPANSIONS[term] || []))
  const categoryScores = categories.map((category) => {
    const name = normalizeQuery(`${category.name} ${category.handle}`)
    const nameTerms = uniq(tokens(name))
    const descriptionTerms = uniq(tokens(`${category.description || ""} ${JSON.stringify(category.metadata || {})}`))
    const nameDirectScore = queryTerms.reduce((sum, term) => {
      const nameMatch = Math.max(0, ...nameTerms.map((candidate) => tokenSimilarity(term, candidate)))
      return sum + nameMatch * 5
    }, 0)
    // Açıklama ve metadata yalnızca kategori adıyla zaten kurulmuş eşleşmeyi
    // güçlendirir. Tek başına "makinesi", "kaliteli" gibi ortak kelimelerle
    // ilgisiz bir kategoriyi seçmesine izin verilmez.
    const descriptionScore = nameDirectScore > 0
      ? queryTerms.reduce((sum, term) => {
          const match = Math.max(0, ...descriptionTerms.map((candidate) => tokenSimilarity(term, candidate)))
          return sum + match * 0.5
        }, 0)
      : 0
    const expandedScore = expandedTerms.reduce((sum, term) => {
      const match = Math.max(0, ...nameTerms.map((candidate) => tokenSimilarity(term, candidate)))
      return sum + match * 1.5
    }, 0)
    const phraseScore = normalized.includes(normalizeQuery(category.name)) ? 12 : 0
    return { category, directScore: nameDirectScore, expandedScore, score: phraseScore + nameDirectScore + descriptionScore + expandedScore }
  }).filter((item) => item.directScore > 0 || item.expandedScore > 0)
    .sort((left, right) => right.score - left.score || right.directScore - left.directScore)

  const directCandidates = categoryScores.filter((item) => item.directScore > 0)
  const first = directCandidates[0] || null
  const second = directCandidates[1] || null
  const ambiguous = Boolean(first && second && Math.abs(first.score - second.score) < 0.75
    && first.category.parent_id !== second.category.id
    && second.category.parent_id !== first.category.id)
  const primary = ambiguous ? null : first?.category || null

  const childrenByParent = new Map<string, CatalogTaxonomyCategory[]>()
  for (const category of categories) {
    if (!category.parent_id) continue
    childrenByParent.set(category.parent_id, [...(childrenByParent.get(category.parent_id) || []), category])
  }
  const descendantIds: string[] = []
  const collectDescendants = (id: string) => {
    for (const child of childrenByParent.get(id) || []) {
      descendantIds.push(child.id)
      collectDescendants(child.id)
    }
  }
  if (primary) collectDescendants(primary.id)

  const directChildren = primary ? childrenByParent.get(primary.id) || [] : []
  const relevantChildren = directChildren.filter((child) => {
    const childTerms = tokens(`${child.name} ${child.handle}`)
    return [...queryTerms, ...expandedTerms].some((term) =>
      childTerms.some((candidate) => tokenSimilarity(term, candidate) > 0)
    )
  })
  const childCategories = (relevantChildren.length ? relevantChildren : directChildren).map(toHint)

  const tagMatches = tags.map((tag) => {
    // Etiket metadata'sında uzun SEO metinleri bulunabildiği için kategori
    // tahmininde yalnızca gerçek etiket değeri kullanılır.
    const tagTerms = tokens(tag.value)
    const score = [...queryTerms, ...expandedTerms].reduce((sum, term) =>
      sum + Math.max(0, ...tagTerms.map((candidate) => tokenSimilarity(term, candidate))), 0)
    return { tag, score }
  }).filter((item) => item.score > 0).sort((left, right) => right.score - left.score)

  if (!primary && !first && !tagMatches.length) return null
  const strongestScore = first?.score || tagMatches[0]?.score * 5 || 0
  return {
    category: primary ? toHint(primary) : null,
    categoryIds: primary ? uniq([primary.id, ...descendantIds]) : [],
    tagIds: tagMatches.slice(0, 8).map((item) => item.tag.id),
    matchedTerms: uniq([...queryTerms, ...expandedTerms]),
    childCategories,
    confidence: Math.min(0.99, Math.max(0.58, strongestScore / 12)),
  }
}
