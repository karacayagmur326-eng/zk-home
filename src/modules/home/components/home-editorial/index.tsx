import Image from "next/image"
import Link from "next/link"
import type { HttpTypes } from "@medusajs/types"
import { ArrowRight } from "@lib/icons"
import type { EditorialCard, HomeEditorialContent } from "@lib/content/home-editorial"
import FeaturedProductCard from "@modules/products/components/featured-product-card"
import EditorialNewsletter from "@modules/home/components/editorial-newsletter"
import HomeMotion from "@modules/home/components/home-motion"
import CollectionCarousel from "../collection-carousel"

export type HomeArticle = {
  id: string
  title: string
  slug: string
  excerpt: string
  image: string
  published_at: string | null
}

function EmphasisHeading({ children }: { children: string }) {
  const words = children.trim().split(/\s+/)
  const accent = words.pop()
  return <h2 className="text-[26px] font-semibold leading-tight tracking-tight text-[#302b2a] sm:text-[32px]">
    {words.join(" ")}{words.length > 0 ? " " : ""}<span className="text-[#C98484]">{accent}</span>
  </h2>
}

function SectionIntro({ title, description, href, linkText }: { title: string; description: string; href?: string; linkText?: string }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div><EmphasisHeading>{title}</EmphasisHeading><p className="mt-1 text-sm text-[#827b78]">{description}</p></div>
    {href && linkText && <Link href={href} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b86f71] hover:underline">{linkText}<ArrowRight className="h-4 w-4" /></Link>}
  </div>
}

function activeCards(cards: EditorialCard[]) { return cards.filter((card) => card.active !== false) }

export default function HomeEditorial({
  content,
  products,
  region,
  articles,
}: {
  content: HomeEditorialContent
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  articles: HomeArticle[]
}) {
  return <HomeMotion><div className="bg-[#fffdfb] pb-14 text-[#302b2a]">
    <div className="content-container home-editorial-container space-y-11 pt-9 sm:space-y-14 sm:pt-12">
      {content.collections_active && activeCards(content.collection_cards).length > 0 && <section aria-label={content.collections_title}>
        <SectionIntro title={content.collections_title} description={content.collections_description} href={content.collections_link_href} linkText={content.collections_link_text} />
        <CollectionCarousel count={activeCards(content.collection_cards).length}>
          {activeCards(content.collection_cards).map((card) => <Link key={card.id} href={card.href} className="group overflow-hidden rounded-[18px] border border-[#eee9e5] bg-[#fbf8f5] transition-shadow hover:shadow-[0_16px_36px_rgba(102,74,65,0.12)]">
            <div className="relative aspect-[16/9] overflow-hidden bg-[#f1ebe6]">
              {card.image && <Image src={card.image} alt={card.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" />}
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div><h3 className="text-lg font-semibold leading-tight">{card.title}</h3><p className="mt-1 line-clamp-1 text-xs text-[#837a76]">{card.description}</p></div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#ad6a6d] shadow-sm transition-colors group-hover:bg-[#C98484] group-hover:text-white"><ArrowRight className="h-4 w-4" /></span>
            </div>
          </Link>)}
        </CollectionCarousel>
      </section>}

      {content.highlights_active && (products.length > 0 || activeCards(content.highlight_cards).length > 0) && <section aria-label={content.highlights_title}>
        <SectionIntro title={products.length > 0 ? "Öne Çıkan Ürünler" : content.highlights_title} description={content.highlights_description} href="/magaza" linkText="Tüm Ürünleri Gör" />
        {products.length > 0 ? <div className="home-featured-grid grid gap-2 sm:gap-4">
          {products.slice(0, 9).map((product, index) => <div key={product.id} data-two={index < Math.floor(Math.min(6, products.length) / 2) * 2} data-three={index < Math.floor(Math.min(9, products.length) / 3) * 3} data-desktop={index < Math.floor(Math.min(5, products.length) / 5) * 5} className="rounded-[18px] border border-[#eee9e5] bg-white p-1 sm:p-2 shadow-sm"><FeaturedProductCard product={product} region={region} showSummary /></div>)}
        </div> : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {activeCards(content.highlight_cards).map((card) => <Link key={card.id} href={card.href} className="group overflow-hidden rounded-[18px] border border-[#eee9e5] bg-white transition-shadow hover:shadow-[0_14px_30px_rgba(102,74,65,0.11)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#f4efea]">{card.image && <Image src={card.image} alt={card.title} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" />}</div>
            <div className="px-3.5 py-3"><h3 className="line-clamp-1 text-sm font-semibold">{card.title}</h3><p className="mt-1 line-clamp-1 text-xs text-[#837a76]">{card.description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#b86f71]">Seçkiyi İncele <ArrowRight className="h-3.5 w-3.5" /></span></div>
          </Link>)}
        </div>}
      </section>}
    </div>

    {content.banner_active && <section className="relative left-1/2 mt-11 w-[calc(100vw-2rem)] max-w-[1680px] -translate-x-1/2 sm:mt-14" aria-label={`${content.banner_title} ${content.banner_accent}`}>
      <div className="relative isolate flex min-h-[270px] overflow-hidden rounded-[24px] bg-[#eee1d6] p-6 sm:h-[310px] sm:min-h-0 sm:items-center sm:px-10 sm:py-7 lg:h-[330px] lg:px-14 lg:py-8">
        {content.banner_image && <Image src={content.banner_image} alt="Sıcak tonlarda yaşam alanı" fill sizes="100vw" className="-z-20 object-cover object-center" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f3e8dd]/95 via-[#f3e8dd]/65 to-transparent" />
        <div className="max-w-[280px] sm:max-w-[42%]"><h2 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[36px] lg:text-[42px]">{content.banner_title}<br /><span className="text-[#be777a]">{content.banner_accent}</span></h2><p className="mt-3 text-sm leading-relaxed text-[#665e5a]">{content.banner_description}</p><Link href={content.banner_link_href} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C98484] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#a95e62]">{content.banner_link_text}<ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </section>}

    <div className="content-container home-editorial-container space-y-11 pt-11 sm:space-y-14 sm:pt-14">
      {content.rooms_active && activeCards(content.room_cards).length > 0 && <section aria-label={content.rooms_title}>
        <SectionIntro title={content.rooms_title} description={content.rooms_description} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {activeCards(content.room_cards).map((card) => <Link key={card.id} href={card.href} className="group relative aspect-[1.65] overflow-hidden rounded-[16px] bg-[#f2ebe5]">
            {card.image && <Image src={card.image} alt={card.title} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />}
            <span className="absolute bottom-3 left-3 rounded-lg bg-[#fffaf5]/95 px-3 py-1.5 text-xs font-semibold text-[#352f2d] shadow-sm">{card.title}</span>
            <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white text-[#9f6265] shadow-sm"><ArrowRight className="h-4 w-4" /></span>
          </Link>)}
        </div>
      </section>}

      {content.inspiration_active && articles.length > 0 && <section aria-label={content.inspiration_title}>
        <SectionIntro title={content.inspiration_title} description={content.inspiration_description} href="/blog" linkText="Tüm Yazıları Gör" />
        <div className="grid gap-4 md:grid-cols-3">
          {articles.slice(0, 3).map((article) => <article key={article.id} className="group overflow-hidden rounded-[18px] border border-[#eee9e5] bg-white">
            <Link href={`/blog/${article.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-[#f2ebe5]">{article.image && <Image src={article.image} alt={article.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" />}</Link>
            <div className="p-4"><p className="text-[11px] text-[#a59a95]">{article.published_at && new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(article.published_at))}</p><Link href={`/blog/${article.slug}`}><h3 className="mt-1 line-clamp-2 text-[17px] font-semibold leading-snug transition-colors group-hover:text-[#ad6a6d]">{article.title}</h3></Link><p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#817773]">{article.excerpt}</p><Link href={`/blog/${article.slug}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#b86f71] hover:underline">Devamını Oku <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          </article>)}
        </div>
      </section>}

      {content.newsletter_active && <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1680px] -translate-x-1/2"><EditorialNewsletter title={content.newsletter_title} description={content.newsletter_description} /></div>}
    </div>
  </div></HomeMotion>
}
