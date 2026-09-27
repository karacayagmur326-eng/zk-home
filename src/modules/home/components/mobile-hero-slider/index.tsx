"use client"

import { useState, useRef, useCallback } from "react"
import Image from "@components/common/SmartImage"
import Link from "next/link"

type Slide = {
  id: string
  title: string
  description?: string
  image?: string
  buttonLabel?: string
  buttonHref?: string
  badge?: string
  active?: boolean
  sortOrder: number
}

export default function MobileHeroSlider({ slides, prioritize = true }: { slides: Slide[]; prioritize?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)

  // Scroll to targeted slide index smoothly
  const scrollToSlide = useCallback((index: number) => {
    setHasInteracted(true)
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth
    containerRef.current.scrollTo({
      left: width * index,
      behavior: "smooth",
    })
    setActiveIndex(index)
  }, [])

  // Track active slide on scroll with RAF throttle
  const handleScroll = () => {
    if (isScrollingRef.current) return
    isScrollingRef.current = true
    requestAnimationFrame(() => {
      isScrollingRef.current = false
      if (!containerRef.current) return
      const { scrollLeft, clientWidth } = containerRef.current
      if (scrollLeft > 2) setHasInteracted(true)
      if (clientWidth > 0) {
        const idx = Math.round(scrollLeft / clientWidth)
        if (idx >= 0 && idx < slides.length && idx !== activeIndex) {
          setActiveIndex(idx)
        }
      }
    })
  }

  if (!slides || slides.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* ── Scroll Track ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={() => setHasInteracted(true)}
        className="flex snap-x snap-mandatory overflow-x-auto px-0 pt-0 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {slides.map((slide, idx) => (
          <article
            key={slide.id || idx}
            className="relative h-[180px] min-w-full snap-center overflow-hidden rounded-none bg-white shadow-none shrink-0"
          >
            {slide.image && (idx === 0 || hasInteracted) && (
              <Image
                src={slide.image}
                alt={slide.title || "Mobil slider"}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 100vw, 480px"
                priority={prioritize && idx === 0}
                fetchPriority={prioritize && idx === 0 ? "high" : "auto"}
                quality={75}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
            <div className="absolute inset-y-0 left-0 z-10 flex w-[62%] flex-col items-start justify-center px-5">
              {slide.badge && (
                <span className="mb-2 rounded-full bg-[#C98484] px-2.5 py-1 font-[family-name:var(--font-barlow-condensed)] text-[8px] font-black tracking-wider text-white shadow-xs">
                  {slide.badge}
                </span>
              )}
              <h1 className="font-[family-name:var(--font-barlow-condensed)] text-[22px] font-black leading-[1.02] text-slate-950">
                {slide.title}
              </h1>
              {slide.description && (
                <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-slate-600">
                  {slide.description}
                </p>
              )}
              {slide.buttonLabel && (
                <Link
                  href={slide.buttonHref || "/magaza"}
                  prefetch={false}
                  aria-label={`${slide.buttonLabel} - ${slide.title}`}
                  className="mt-3 rounded-lg bg-[#C98484] px-3 py-2 text-[9px] font-extrabold text-white active:scale-95 transition-transform hover:bg-[#A95E5E]"
                >
                  {slide.buttonLabel}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* ── Slider Indicator Dots (Micro Minimalist Dots Layout) ── */}
      {slides.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 6,
            right: 10,
            zIndex: 30,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          {slides.map((_, idx) => {
            const isActive = idx === activeIndex
            return (
              <button
                key={idx}
                type="button"
                aria-label={`Slayt ${idx + 1} göster`}
                onClick={() => scrollToSlide(idx)}
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "block",
                    width: isActive ? "16px" : "5px",
                    height: "5px",
                    borderRadius: "9999px",
                    backgroundColor: isActive ? "#C98484" : "#94a3b8",
                    transition: "all 0.3s ease",
                  }}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
