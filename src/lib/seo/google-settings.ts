export function normalizeGoogleVerification(value: string): string {
  const input = value.trim()
  if (/<meta\b/i.test(input)) {
    if (!/name\s*=\s*["']google-site-verification["']/i.test(input))
      return input
    return input.match(/content\s*=\s*["']([^"']+)["']/i)?.[1]?.trim() || input
  }
  return input.replace(/^google-site-verification\s*=\s*/i, "").trim()
}

export const sitemapKinds = [
  "products",
  "categories",
  "collections",
  "pages",
  "blog",
] as const
export type SitemapKind = (typeof sitemapKinds)[number]
export const sitemapLabels: Record<SitemapKind, string> = {
  products: "Ürünler",
  categories: "Kategoriler",
  collections: "Markalar",
  pages: "Sayfalar",
  blog: "Blog yazıları",
}
export const changeFrequencies = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
] as const
export type SitemapSettings = {
  enabled: boolean
  images: boolean
  home: boolean
  homePriority: number
  homeChangefreq: string
  sections: Record<
    SitemapKind,
    { enabled: boolean; priority: number; changefreq: string }
  >
}
export function normalizeSitemapSettings(value?: any): SitemapSettings {
  return {
    enabled: value?.enabled !== false,
    images: value?.images !== false,
    home: value?.home !== false,
    homePriority:
      typeof value?.homePriority === "number" &&
      Number.isFinite(value.homePriority)
        ? Math.max(0, Math.min(1, value.homePriority))
        : 1,
    homeChangefreq: changeFrequencies.includes(value?.homeChangefreq)
      ? value.homeChangefreq
      : "daily",
    sections: Object.fromEntries(
      sitemapKinds.map((kind) => {
        const section = value?.sections?.[kind]
        return [
          kind,
          {
            enabled: section?.enabled !== false,
            priority:
              typeof section?.priority === "number" &&
              Number.isFinite(section.priority)
                ? Math.max(0, Math.min(1, section.priority))
                : kind === "pages"
                ? 0.5
                : 0.8,
            changefreq: changeFrequencies.includes(section?.changefreq)
              ? section.changefreq
              : kind === "pages"
              ? "monthly"
              : "weekly",
          },
        ]
      })
    ) as SitemapSettings["sections"],
  }
}
