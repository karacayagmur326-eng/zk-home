import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  breadcrumbCategories?: Array<{
    id: string
    name: string
    handle: string
  }>
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  breadcrumbCategories = [],
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const { cheapestPrice } = getProductPrice({ product })
  const discountBadge =
    cheapestPrice?.percentage_diff && cheapestPrice.percentage_diff !== "0"
      ? cheapestPrice.percentage_diff
      : undefined

  return (
    <div className="bg-white pt-2 pb-6 sm:pb-8 lg:py-6 font-sans">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5">
        {/* Breadcrumbs (Hidden on mobile) */}
        <div className="hidden sm:flex no-scrollbar mb-3 sm:mb-5 items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-slate-500 font-medium">
          <LocalizedClientLink href="/" className="hover:text-[#C98484] transition-colors">
            Ana Sayfa
          </LocalizedClientLink>
          <span>&gt;</span>
          <LocalizedClientLink href="/magaza" className="hover:text-[#C98484] transition-colors">
            Ürün Kategorileri
          </LocalizedClientLink>
          {breadcrumbCategories.map((category) => (
            <React.Fragment key={category.id}>
              <span>&gt;</span>
              <LocalizedClientLink
                href={`/kategoriler/${category.handle}`}
                className="transition-colors hover:text-[#C98484]"
              >
                {category.name}
              </LocalizedClientLink>
            </React.Fragment>
          ))}
          <span>&gt;</span>
          <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-[300px]">
            {product.title}
          </span>
        </div>

        {/* ── MAIN PRODUCT CONTAINER (Seamless Full-Width White Stage) ── */}
        <div
          className="space-y-3 sm:space-y-8 bg-white p-0 sm:p-2 lg:space-y-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200/90 lg:p-5 lg:shadow-xs"
          data-testid="product-container"
        >
          {/* ── MOBILE: Stacked layout | DESKTOP: 3-column grid ── */}

          {/* MOBILE GALLERY (shown only on mobile, above product info) */}
          <div className="lg:hidden">
            <ImageGallery images={images} productTitle={product.title} discountBadge={discountBadge} product={product} />
          </div>

          {/* MOBILE PRODUCT INFO (shown only on mobile, below gallery) */}
          <div className="lg:hidden">
            <ProductInfo product={product} />
          </div>

          {/* MOBILE BUY BOX (shown only on mobile, below product info) */}
          <div className="lg:hidden">
            <ProductOnboardingCta />
            <Suspense
              fallback={<ProductActions disabled={true} product={product} region={region} />}
            >
              <ProductActions product={product} region={region} />
            </Suspense>
          </div>

          {/* DESKTOP: 3-Column Grid (hidden on mobile) */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-0 lg:pb-6">
            {/* Left Column: Image Gallery (4 cols with vertical thumbnails on left) */}
            <div className="col-span-4 pr-6">
              <ImageGallery images={images} productTitle={product.title} discountBadge={discountBadge} product={product} />
            </div>

            {/* Middle Column: Product Info (5 cols) */}
            <div className="col-span-5 flex flex-col px-6">
              <ProductInfo product={product} />
            </div>

            {/* Right Column: Buy Box Card (3 cols) */}
            <div className="col-span-3 pl-6">
              <div className="sticky top-24">
                <ProductOnboardingCta />
                <Suspense
                  fallback={<ProductActions disabled={true} product={product} region={region} />}
                >
                  <ProductActions product={product} region={region} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Sweet Thin Horizontal Divider Line 1 */}
          <div className="border-t border-slate-100 pt-2 sm:pt-6 lg:py-6">
            {/* Bottom Tabs & Details inside the same unified card */}
            <ProductTabs product={product} price={cheapestPrice?.calculated_price_number} />
          </div>

          {/* Sweet Thin Horizontal Divider Line 2 (Benzer Ürünler için) */}
          <div
            className="border-t border-slate-100 pt-6 sm:pt-8 lg:pt-6"
            data-testid="related-products-container"
          >
            {/* Related Products inside the same unified white card */}
            <Suspense fallback={<SkeletonRelatedProducts />}>
              <RelatedProducts product={product} countryCode={countryCode} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTemplate
