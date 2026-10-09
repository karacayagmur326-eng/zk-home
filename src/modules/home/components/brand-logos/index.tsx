import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

function getBrandLogo(collection: HttpTypes.StoreCollection) {
  const metadata = (collection.metadata || {}) as Record<string, unknown>
  const candidate = metadata.logo_url || metadata.image_url || metadata.logo
  return typeof candidate === "string" && candidate.trim() ? candidate : null
}

export default function BrandLogos({
  brands,
}: {
  brands: HttpTypes.StoreCollection[]
}) {
  return (
    <section
      aria-labelledby="brand-logos-title"
      className="border-y border-border bg-card py-10 sm:py-12"
    >
      <div className="content-container">
        <div className="mb-6 text-center">
          <p className="text-xs font-black tracking-[0.16em] text-primary">
            GÜVENİLEN MARKALAR
          </p>
          <h2
            id="brand-logos-title"
            className="mt-1 text-2xl font-black text-foreground sm:text-3xl"
          >
            Profesyonellerin Tercihi
          </h2>
        </div>

        {brands.length ? (
          <div className="-mx-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto px-gutter pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5 xl:grid-cols-6">
            {brands.slice(0, 12).map((brand) => {
              const logo = getBrandLogo(brand)

              return (
                <LocalizedClientLink
                  key={brand.id}
                  href={`/markalar/${brand.handle}`}
                  aria-label={`${brand.title} ürünlerini görüntüle`}
                  className="group flex h-24 w-44 shrink-0 snap-start items-center justify-center rounded-rounded border border-border bg-background px-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={brand.title}
                      className="max-h-12 max-w-full object-contain opacity-75 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  ) : (
                    <span className="text-center text-lg font-black uppercase tracking-wider text-muted transition-colors group-hover:text-primary">
                      {brand.title}
                    </span>
                  )}
                </LocalizedClientLink>
              )
            })}
          </div>
        ) : (
null
        )}
      </div>
    </section>
  )
}
