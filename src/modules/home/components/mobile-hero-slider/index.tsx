"use client"

import Image from "@components/common/SmartImage"
import Link from "next/link"
import useFadeSlider from "../use-fade-slider"

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
  const { activeIndex, select: scrollToSlide, gestures } = useFadeSlider(slides.length, false)

  if (!slides || slides.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden select-none" role="region" aria-label="Mobil kampanyalar" aria-roledescription="carousel" {...gestures}>
      {/* ── Scroll Track ── */}
      <div
        className="relative h-[200px] touch-pan-y"
      >
        {slides.map((slide, idx) => (
          <article
            key={slide.id || idx}
            className="zkhome-fade-slide absolute inset-0 h-[200px] w-full overflow-hidden rounded-none bg-white shadow-none"
            data-active={idx === activeIndex}
            aria-hidden={idx !== activeIndex}
            inert={idx !== activeIndex}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} / ${slides.length}`}
          >
            {slide.image && (
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
            <div className="zkhome-slide-content absolute inset-y-0 left-0 z-10 flex w-[62%] flex-col items-start justify-center px-5">
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
                aria-current={isActive ? "true" : undefined}
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
