"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "@components/common/SmartImage"
import { useState, useRef, useEffect } from "react"
import clx from "clsx"
import { Search, ChevronDown, X, ChevronLeft, ChevronRight } from "@lib/icons"
import { FavoriteButton } from "@modules/products/components/product-card-actions"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  productTitle: string
  discountBadge?: string
  product?: HttpTypes.StoreProduct
}

const safeUrl = (url: string) => {
  try {
    return decodeURI(url)
  } catch {
    return url
  }
}

const ImageGallery = ({ images, productTitle, discountBadge, product }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Body scroll lock & Escape key handler for Lightbox
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden"
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsLightboxOpen(false)
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => {
        document.body.style.overflow = ""
        window.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [isLightboxOpen])

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[300px] sm:h-[460px] bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xs">
        Görsel Yok
      </div>
    )
  }

  const mainImage = images[activeIndex] || images[0]

  const handlePrevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  // Touch swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNextImage()
      else handlePrevImage()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div className="relative flex h-full flex-col-reverse items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs md:flex-row md:gap-4 md:!rounded-none md:!border-0 md:!bg-transparent md:!p-0 md:!shadow-none">
      {/* ── THUMBNAILS (Vertical on Desktop Left | Horizontal on Mobile Bottom) ── */}
      {images.length > 1 && (
        <div className="no-scrollbar flex flex-row sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[470px] w-full sm:w-16 lg:w-20 shrink-0 sm:py-0.5">
          {images.map((image, index) => {
            const isActive = activeIndex === index
            return (
              <button
                key={image.id || index}
                onClick={() => setActiveIndex(index)}
                className={clx(
                  "relative aspect-square w-14 sm:w-full rounded-2xl overflow-hidden border-2 transition-all bg-white flex items-center justify-center shrink-0 cursor-pointer p-1 shadow-2xs",
                  isActive
                    ? "border-[#C98484] shadow-xs"
                    : "border-slate-200/90 hover:border-slate-300 opacity-80 hover:opacity-100"
                )}
              >
                <Image
                  src={safeUrl(image.url)}
                  alt={`${productTitle} - ${index + 1}. görünüm`}
                  fill
                  unoptimized
                  className="object-contain p-1"
                  sizes="100px"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* ── MAIN IMAGE STAGE (White Stage with Faint Contour Line) ── */}
      <div
        className="relative flex-1 w-full min-w-0 aspect-square sm:aspect-auto sm:min-h-[470px] !border-0 !rounded-none !bg-transparent !shadow-none overflow-hidden flex items-center justify-center p-3 sm:p-6 group cursor-zoom-in"
        style={{ border: 0, borderRadius: 0, background: "transparent", boxShadow: "none" }}
        onClick={() => setIsLightboxOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top-Left Discount Badge */}
        {discountBadge && discountBadge !== "0" && (
          <span className="absolute top-3 left-3 z-20 rounded-xl bg-[#e02b27] px-3 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider">
            %{discountBadge} İNDİRİM
          </span>
        )}

        {/* Floating Favorite Heart Button (Top-Right of Main Image Stage on Mobile) */}
        {product && (
          <div
            className="absolute top-3 right-3 z-30 sm:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <FavoriteButton
              product={{
                id: product.id,
                title: product.title,
                handle: product.handle,
                thumbnail: product.thumbnail,
                variantId: product.variants?.[0]?.id,
                price: (product.variants?.[0] as any)?.calculated_price?.calculated_amount || null,
              }}
              variant="icon"
              className="h-10 w-10 rounded-full bg-white/95 border border-slate-200/90 shadow-md flex items-center justify-center text-slate-700 hover:text-[#C98484] active:scale-95 transition-all cursor-pointer"
            />
          </div>
        )}

        <Image
          src={safeUrl(mainImage.url)}
          alt={`${productTitle} ürün görseli`}
          fill
          unoptimized
          priority
          className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 520px"
        />

        {/* Mobile: Prev/Next arrows overlay */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 sm:hidden w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs border border-slate-200/80 text-slate-700 flex items-center justify-center shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 sm:hidden w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs border border-slate-200/80 text-slate-700 flex items-center justify-center shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Mobile: Image counter badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:hidden bg-black/50 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* Floating "TÜM ÖZELLİKLER >" Pill Button (Only on Mobile) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            const tabsElem = document.getElementById("product-tabs") || document.getElementById("teknik-ozellikler")
            if (tabsElem) {
              tabsElem.scrollIntoView({ behavior: "smooth" })
            }
          }}
          className="absolute bottom-3 left-3 z-20 sm:hidden inline-flex items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 px-3.5 py-1.5 text-[11px] font-extrabold text-[#C98484] shadow-xs hover:bg-[#C98484] hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <span>TÜM ÖZELLİKLER</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Zoom Button Icon (Bottom Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsLightboxOpen(true)
          }}
          aria-label="Görseli büyüt"
          className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-700 flex items-center justify-center shadow-xs hover:text-[#C98484] hover:border-[#C98484] transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* ── COMPACT LIGHTBOX MODAL ── */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Centered Modal Card */}
          <div
            className="relative w-full max-w-3xl bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-Right Close Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="Kapat"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Main Lightbox Image Stage */}
            <div
              className="relative w-full flex items-center justify-center min-h-[280px] max-h-[65vh] py-2"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Left Arrow */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevImage()
                  }}
                  className="absolute left-1 sm:left-2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer shadow-lg active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
              )}

              {/* Main Enlarged Image */}
              <div className="relative w-full h-[50vh] sm:h-[60vh] max-h-[600px]">
                <Image
                  src={safeUrl(mainImage.url)}
                  alt={`${productTitle} büyük görünüm`}
                  fill
                  unoptimized
                  priority
                  className="object-contain select-none"
                />
              </div>

              {/* Right Arrow */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextImage()
                  }}
                  className="absolute right-1 sm:right-2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer shadow-lg active:scale-95"
                >
                  <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails (if multiple) */}
            {images.length > 1 && (
              <div className="mt-2 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1 max-w-full">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveIndex(idx)}
                    className={clx(
                      "relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden border-2 bg-white shrink-0 transition-all cursor-pointer p-0.5",
                      activeIndex === idx
                        ? "border-[#C98484] scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={safeUrl(img.url)}
                      alt=""
                      fill
                      unoptimized
                      className="object-contain p-0.5"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGallery
