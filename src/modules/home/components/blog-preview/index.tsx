import { ArrowRight, BookOpen, CalendarDays } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type BlogPreviewItem = {
  id: string
  category: string
  title: string
  excerpt: string
  publishedAt: string
  readingTime: string
}

export const DEFAULT_BLOG_ITEMS: BlogPreviewItem[] = []

export default function BlogPreview({
  articles = DEFAULT_BLOG_ITEMS,
}: {
  articles?: BlogPreviewItem[]
}) {
  if (!articles.length) return null

  return (
    <section
      aria-labelledby="home-blog-title"
      className="content-container py-12 sm:py-16"
    >
      <div className="mb-8 flex items-end justify-between gap-5">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-primary">
            UZMANINDAN İPUÇLARI
          </p>
          <h2
            id="home-blog-title"
            className="mt-1 text-3xl font-black text-foreground sm:text-4xl"
          >
            Rehber ve Makaleler
          </h2>
        </div>
        <LocalizedClientLink
          href="/blog"
          className="hidden items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover sm:inline-flex"
        >
          Tüm Yazılar
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </LocalizedClientLink>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {articles.slice(0, 3).map((article) => (
          <article
            key={article.id}
            id={article.id}
            className="group flex flex-col rounded-desktop-wide border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-card"
          >
            <BookOpen aria-hidden="true" className="h-8 w-8 text-primary" />
            <p className="mt-5 text-xs font-black uppercase tracking-wider text-primary">
              {article.category}
            </p>
            <h3 className="mt-2 text-xl font-black leading-tight text-foreground">
              {article.title}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
              {article.excerpt}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted">
              <time
                dateTime={article.publishedAt}
                className="flex items-center gap-1.5"
              >
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                {new Intl.DateTimeFormat("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(article.publishedAt))}
              </time>
              <span>{article.readingTime}</span>
            </div>
            <LocalizedClientLink
              href={`/blog#${article.id}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary"
            >
              Devamını Oku
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </LocalizedClientLink>
          </article>
        ))}
      </div>
    </section>
  )
}
