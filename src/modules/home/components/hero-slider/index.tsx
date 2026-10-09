"use client"

import React, { useEffect, useState } from "react"
import SliderImage from "../slider-image"
import useFadeSlider from "../use-fade-slider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { AppIcon, ArrowLeft, ArrowRight, Pause, Play } from "@lib/icons"
import { sliderColorOnWhite } from "@lib/content/slider-colors"
import { turkishTitleCase } from "@lib/util/turkish-title-case"

function sliderForeground(background: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(background)
  if (!match) return "#FFFFFF"
  const hex = match[1]
  const brightness = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000
  return brightness > 160 ? "#16181B" : "#FFFFFF"
}

const EDITORIAL_HERO_IMAGE = "/hero/zkhome-panorama-v4.png"

const SLIDER_FONT_STACKS: Record<string, string> = {
  "Plus Jakarta Sans":
    "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', Arial, sans-serif",
  "Playfair Display":
    "var(--font-playfair-display), 'Playfair Display', Georgia, serif",
  "Barlow Condensed":
    "var(--font-barlow-condensed), 'Barlow Condensed', 'Arial Narrow', sans-serif",
  Inter: "var(--font-inter), Inter, Arial, sans-serif",
  Arial: "Arial, sans-serif",
  Georgia: "Georgia, serif",
  Verdana: "Verdana, sans-serif",
  "Trebuchet MS": "'Trebuchet MS', sans-serif",
  "Courier New": "'Courier New', monospace",
}

function resolveSliderFont(value: unknown, fallback: string) {
  return SLIDER_FONT_STACKS[String(value || "")] || SLIDER_FONT_STACKS[fallback]
}

function resolveSliderWeight(value: unknown, fallback: number) {
  const weight = Number(value)
  return [300, 400, 500, 600, 700, 800, 900].includes(weight)
    ? weight
    : fallback
}

// Unified SVG Icon Selector
function DynamicIcon({
  name,
  className = "w-5 h-5 text-primary flex-shrink-0",
}: {
  name: string
  className?: string
}) {
  return <AppIcon name={name} fallback="check" className={className} />

  /* Legacy SVG cases retained temporarily as dead code for a low-risk visual migration. */
  switch (name) {
    case "bolt":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      )
    case "gear":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )
    case "shield":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      )
    case "sun":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      )
    case "battery":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 10.5h.75v3h-.75v-3zM3 7.5h15a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 15V9a1.5 1.5 0 011.5-1.5z"
          />
        </svg>
      )
    case "case":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 18.4V14.15m16.5 0c0-1.22-.821-2.278-2.02-2.533a12.947 12.947 0 00-10.96 0c-1.199.255-2.02 1.313-2.02 2.533m16.5 0V8.25c0-.621-.504-1.125-1.125-1.125H16.5m-3 0V4.875A1.125 1.125 0 0012.375 3.75h-2.25A1.125 1.125 0 009 4.875V7.125m3 0H9"
          />
        </svg>
      )
    case "star":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499c.173-.439.817-.439.99 0l3.024 7.684 8.243.684c.48.04.673.633.313.953l-6.19 5.507 1.83 8.15c.107.476-.412.852-.822.584l-7.398-4.83-7.397 4.83c-.41.268-.93-.108-.822-.584l1.83-8.15-6.19-5.507c-.36-.32-.167-.913.313-.953l8.243-.684 3.024-7.684z"
          />
        </svg>
      )
    case "wrench":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75a4.5 4.5 0 01-4.822 4.492l-4.148 4.148v2.793a3 3 0 01-.879 2.121l-1.586 1.586a1.5 1.5 0 01-2.122-2.122l1.586-1.586a3 3 0 012.121-.879h2.793l4.148-4.148A4.5 4.5 0 0121.75 6.75z"
          />
        </svg>
      )
    case "drill":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 6h9.5l1.5 2v3.5l-1.5 1H8.5v6.5h3.5v2H5.5v-2h1v-6.5H5V6z M16 8h2v3.5h-2V8z M18 9.75l4 .5-4 .5M20 9v1.5 M8 10h1.5v1.5H8z"
          />
        </svg>
      )
    case "hammer":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.5 12.5L20.5 6.5 M17.5 9.5L19 8 M14.5 3.5L11.5 6.5 M16.5 1.5l3 3 M11.5 6.5l-3.5-3.5 2-2 1.5 1.5 M7 16l-5 5 M5 14L2 17"
          />
        </svg>
      )
    case "screwdriver":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 20a2.5 2.5 0 003.5-3.5l-2.5-2.5A2.5 2.5 0 001.5 17.5L4 20z M7.5 16.5l8-8 M15.5 8.5l3.5-3.5 1.5 1.5-3.5 3.5"
          />
        </svg>
      )
    case "plug":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12a3 3 0 003 3h0a3 3 0 003-3V6H9v6z M10 6V3 M14 6V3 M12 15v5a2 2 0 002 2h4"
          />
        </svg>
      )
    case "speed":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18a6 6 0 100-12 6 6 0 000 12z M12 12l3.5-3.5 M6 12h2 M16 12h2 M12 6v2 M12 16v2"
          />
        </svg>
      )
    case "brushless":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3a9 9 0 019 9c0 2.5-1 4.5-2.5 6M12 21a9 9 0 01-9-9c0-2.5 1-4.5 2.5-6M12 8a4 4 0 100 8 4 4 0 000-8z M14 12l2 2"
          />
        </svg>
      )
    case "battery-bolt":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 10.5h.75v3h-.75v-3zM3 7.5h15a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 15V9a1.5 1.5 0 011.5-1.5z M11 10l-2 2.5h3L10 15"
          />
        </svg>
      )
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      )
  }
}

function ElectricBeamBorder({ radius = 12 }: { radius?: number }) {
  return (
    <svg
      className="beam-svg pointer-events-none absolute -inset-[1.5px] h-[calc(100%+3px)] w-[calc(100%+3px)] overflow-visible rounded-[inherit] z-20"
      style={{ opacity: 0, transition: "opacity 0.3s ease" }}
    >
      <defs>
        <linearGradient id="electricBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <stop offset="50%" stopColor="#C98484" stopOpacity="1" />
          <stop offset="100%" stopColor="#C98484" stopOpacity="0" />
        </linearGradient>
        <filter id="electricBeamGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx={radius}
        ry={radius}
        fill="none"
        stroke="url(#electricBeamGrad)"
        strokeWidth="2.5"
        strokeDasharray="90 450"
        filter="url(#electricBeamGlow)"
        className="beam-path"
      />
    </svg>
  )
}

export default function HeroSlider({
  initialSliders = [],
}: {
  initialSliders?: any[]
}) {
  const [sliders, setSliders] = useState<any[]>(initialSliders)
  const { activeIndex: selectedIndex, select: scrollTo, isPlaying, paused, toggle: toggleAutoplay, gestures } = useFadeSlider(sliders.length)

  // Admin gibi canlı önizleme kullanan ekranlarda gelen veriyi anında yansıt.
  useEffect(() => {
    if (initialSliders && initialSliders.length > 0) {
      setSliders(initialSliders)
    }
  }, [initialSliders])

  useEffect(() => {
    if (!initialSliders || initialSliders.length === 0) {
      fetch("/api/catalog/sliders", {
        cache: "no-store",
        headers: {
          "x-publishable-api-key":
            "",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setSliders(Array.isArray(data.sliders) ? data.sliders : [])
        })
        .catch(() => setSliders([]))
    }
  }, [])

  const resolveSlideLink = (link: string) =>
    link === "/store" ? "/magaza" : link

  const renderHeading = (
    text: string,
    highlightColor: string,
    defaultTextColor?: string
  ) => {
    if (!text) return null
    const lines = text.split("\n")
    return lines.map((lineWithColor, lineIdx) => {
      const lineParts = lineWithColor.split("|")
      const lineText = turkishTitleCase(lineParts[0] || "")
      const rawLineColor = lineParts[1] || defaultTextColor || "#FFFFFF"
      const lineColor = rawLineColor
      const lineSize = lineParts[2] || ""
      const lineFontFamily = ["Barlow Condensed", "Playfair Display"].includes(lineParts[3])
        ? "Plus Jakarta Sans"
        : lineParts[3] || "Plus Jakarta Sans"
      const lineFontWeight = lineParts[4] || "600"
      const parts = lineText.split("**")
      return (
        <div
          key={lineIdx}
          className={lineIdx > 0 ? "mt-1 sm:mt-1.5" : ""}
          style={{
            color: lineColor,
            fontFamily: resolveSliderFont(lineFontFamily, "Plus Jakarta Sans"),
            fontWeight: resolveSliderWeight(lineFontWeight, 600),
            fontSize: `clamp(1.1rem, 3.1vw, ${lineSize || "3.8rem"})`,
            lineHeight: 1.12,
          }}
        >
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <span
                key={i}
                style={{ color: highlightColor || "#C98484" }}
                className="text-[#C98484] transition-colors duration-300"
              >
                {part}
              </span>
            ) : (
              part
            )
          )}
        </div>
      )
    })
  }

  if (!sliders || sliders.length === 0) return null

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Öne çıkan kampanyalar"
      {...gestures}
      className="group relative w-full overflow-hidden bg-[#eef0f2] font-sans aspect-[16/8] sm:aspect-[16/7.4] md:aspect-[16/6.8] lg:aspect-[16/6.4] max-h-[560px] min-h-[280px]"
      style={{ isolation: "isolate" }}
    >
      <style>{`
        @keyframes rotateBorder {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes progressPulse {
          0% {
            width: 0%;
            opacity: 0.6;
          }
          50% {
            opacity: 0.95;
          }
          100% {
            width: 100%;
            opacity: 0.6;
          }
        }
        
        @keyframes screwBadge {
          0% {
            opacity: 0;
            transform: translate3d(0, 8px, 0) rotate(-12deg) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
        }
        
        @keyframes drillHeading {
          0% {
            opacity: 0;
            transform: translate3d(0, -18px, 0);
          }
          65% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
          85% {
            transform: translate3d(0, -2px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        
        @keyframes screwFeature {
          0% {
            opacity: 0;
            transform: translate3d(-15px, 0, 0) rotate(-8deg) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
        }
        
        @keyframes rightFeatureDrill {
          0% {
            opacity: 0;
            transform: translate3d(30px, 0, 0);
          }
          85% {
            transform: translate3d(-3px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        
        @keyframes nailButton {
          0% {
            opacity: 0;
            transform: translate3d(0, 12px, 0) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        
        .zkhome-hero-slide-item {
          container-type: inline-size;
          container-name: heroslide;
        }

        .zkhome-heading, .zkhome-badge, .zkhome-subheading {
          will-change: transform, opacity;
        }

        /* 1:1 Proportional Scaling System */
        .zkhome-heading {
          font-family: var(--slider-font-title, Arial, sans-serif);
          font-weight: 600;
          letter-spacing: -0.035em;
          line-height: 1.12;
          font-stretch: normal !important;
        }

        .zkhome-heading span {
          font-weight: inherit !important;
        }

        .zkhome-badge {
          font-size: clamp(9px, 0.95cqi, 12px) !important;
          padding: clamp(3px, 0.4cqi, 5px) clamp(8px, 1.1cqi, 16px) !important;
          margin-bottom: clamp(0.3rem, 0.7cqi, 0.75rem) !important;
        }

        .zkhome-subheading {
          font-size: clamp(10px, 1.15cqi, 15px) !important;
          margin-bottom: clamp(0.4rem, 0.9cqi, 1rem) !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }

        .zkhome-bottom-features {
          margin-bottom: clamp(0.4rem, 1.1cqi, 1.25rem) !important;
          gap: clamp(0.3rem, 0.7cqi, 0.65rem) !important;
        }

        .zkhome-feature-item {
          min-height: clamp(30px, 3.4cqi, 46px) !important;
          padding: clamp(3px, 0.5cqi, 8px) clamp(5px, 0.8cqi, 10px) !important;
          border-radius: clamp(8px, 0.9cqi, 12px) !important;
          gap: clamp(4px, 0.6cqi, 8px) !important;
        }

        .zkhome-feature-icon-box {
          width: clamp(20px, 2.2cqi, 32px) !important;
          height: clamp(20px, 2.2cqi, 32px) !important;
        }

        .zkhome-feature-icon {
          width: clamp(12px, 1.4cqi, 20px) !important;
          height: clamp(12px, 1.4cqi, 20px) !important;
        }

        .zkhome-feature-title {
          font-size: clamp(8.5px, 0.95cqi, 12px) !important;
        }

        .zkhome-feature-desc {
          font-size: clamp(7.5px, 0.8cqi, 10px) !important;
        }

        .zkhome-buttons-container {
          gap: clamp(6px, 0.8cqi, 12px) !important;
        }

        .zkhome-slide-btn {
          padding: clamp(6px, 0.8cqi, 12px) clamp(12px, 1.6cqi, 24px) !important;
          font-size: clamp(10px, 1.1cqi, 14px) !important;
          border-radius: clamp(8px, 1cqi, 12px) !important;
          gap: clamp(4px, 0.6cqi, 8px) !important;
        }

        .zkhome-slide-btn svg {
          width: clamp(12px, 1.2cqi, 16px) !important;
          height: clamp(12px, 1.2cqi, 16px) !important;
        }

        @media (max-width: 639px) {
          .zkhome-mobile-content [style*="opacity: 0"] {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }

          .zkhome-heading > div {
            line-height: 1.02 !important;
          }

          .zkhome-heading > div + div {
            margin-top: 0.2rem !important;
          }

          .mobile-hero-img {
            object-position: 68% top;
          }
        }
        
        /* Premium Sleek Border Glow Hover Effect */
        .electric-hover-trigger {
          position: relative !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .electric-hover-trigger:hover {
          transform: translateY(-3px) scale(1.02) !important;
          border-color: #C98484 !important;
          box-shadow: 0 10px 30px -5px rgba(201, 132, 132, 0.35), 0 0 15px rgba(201, 132, 132, 0.25) !important;
        }

        @media (min-width: 640px) {
          .mobile-hero-img {
            mask-image: none;
            -webkit-mask-image: none;
          }
        }
        @media (min-width: 768px) {
          .mobile-hero-img {
            width: auto !important;
            height: auto !important;
            max-width: 100%;
            max-height: 100%;
            left: auto !important;
            top: 50% !important;
            bottom: auto !important;
            transform: translateY(-50%);
            mask-image: none;
            -webkit-mask-image: none;
          }
        }
        @media (min-width: 1900px) {
          .zkhome-panorama-img {
            mask-image: none;
            -webkit-mask-image: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html:not([data-site-motion="on"] ) .zkhome-slider-motion,
          html:not([data-site-motion="on"] ) .zkhome-slider-motion * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Autoplay Glowing Electric Progress Bar at the very bottom */}
      <div className="absolute bottom-0 left-0 h-[3px] bg-black/40 w-full z-20 overflow-hidden pointer-events-none">
        <div
          key={selectedIndex} // Resets key and re-runs animation on index change
          className="h-full bg-gradient-to-r from-[#C98484] to-[#FFD700] rounded-r-sm"
          style={{
            boxShadow: "0 0 10px #FFD700, 0 0 20px #C98484",
            animation: isPlaying ? "progressPulse 5s linear forwards" : "none",
          }}
        />
      </div>

      <div
        className="zkhome-slider-motion h-full w-full overflow-hidden"
      >
        <div className="relative h-full w-full touch-pan-y">
          {sliders.map((slider, index) => {
            const isActive = index === selectedIndex
            const HeadingTag = index === 0 ? "h1" : "h2"
            const showSecondaryButton = Boolean(
              slider.button2_link && slider.button2_text
            )

            // Parse Bottom Features
            let bottomFeatures: any[] = []
            try {
              if (slider.features) {
                const parsed =
                  typeof slider.features === "string"
                    ? JSON.parse(slider.features)
                    : slider.features
                bottomFeatures = Array.isArray(parsed) ? parsed : []
              }
            } catch (e) {
              bottomFeatures = []
            }

            // Parse Right Features
            let rightFeaturesList: any[] = []
            try {
              if (slider.right_features) {
                const parsed =
                  typeof slider.right_features === "string"
                    ? JSON.parse(slider.right_features)
                    : slider.right_features
                rightFeaturesList = Array.isArray(parsed) ? parsed : []
              }
            } catch (e) {
              rightFeaturesList = []
            }

            const backgroundColor = sliderColorOnWhite(slider.bg_color || "#eef0f2")
            const textColor = slider.text_color || "#16181B"
            const highlightColor = slider.button_color || "#C98484"
            const badgeColor = slider.badge_color || highlightColor
            const secondaryButtonColor = slider.button2_color || "#FFFFFF"

            return (
              <div
                className="zkhome-hero-slide-item zkhome-fade-slide absolute inset-0 h-full w-full min-w-0"
                data-active={isActive}
                inert={!isActive}
                key={slider.id || index}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${sliders.length}`}
                aria-hidden={!isActive}
                style={{ backgroundColor }}
              >
                {slider.image_url && (
                  <div className="absolute inset-0 z-[1] isolate overflow-hidden pointer-events-none">
                    <div className={slider.image_url === EDITORIAL_HERO_IMAGE ? "absolute inset-y-0 right-0 w-full min-[1900px]:w-[1860px]" : "absolute inset-0"}>
                    <SliderImage
                      src={slider.image_url}
                      alt=""
                      fill
                      sizes="100vw"
                      unoptimized
                      priority={index === 0}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      className={slider.image_url === EDITORIAL_HERO_IMAGE ? "object-cover object-top min-[1900px]:object-[center_20%] zkhome-panorama-img" : "object-scale-down object-right mobile-hero-img"}
                    />
                    </div>
                    {/* A clear color tint preserves image detail like colored glass. */}
                    <div
                      style={{
                        background: `linear-gradient(90deg, ${backgroundColor} 0%, ${backgroundColor} 38%, ${backgroundColor}CC 48%, ${backgroundColor}66 59%, ${backgroundColor}00 73%)`,
                        mixBlendMode: "multiply",
                      }}
                      className="zkhome-desktop-gradient absolute inset-0 z-10 hidden md:block pointer-events-none"
                    />
                  </div>
                )}


                <div className="absolute inset-0 flex items-end sm:items-center justify-start content-container z-20 px-3.5 sm:px-6 md:px-10 lg:px-14 pb-8 sm:pb-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 w-full sm:items-center">
                    {/* Left Column: Staggered entrance animations and hover states */}
                    <div
                      className="zkhome-mobile-content zkhome-slide-content col-span-12 lg:col-span-8 max-w-[680px] lg:max-w-[620px] xl:max-w-[700px] flex flex-col items-start z-20"
                      style={{ color: textColor }}
                    >
                      {/* 1. Badge with double slashes (Orange background, white text) */}
                      {slider.badge_text?.split("|")[0]?.trim() && (
                        <div
                          style={
                            {
                              backgroundColor: badgeColor,
                              color: sliderForeground(badgeColor),
                              fontFamily: resolveSliderFont(
                                slider.badge_text.split("|")[2],
                                "Inter"
                              ),
                              fontWeight: resolveSliderWeight(
                                slider.badge_text.split("|")[3],
                                600
                              ),
                              animation: isActive
                                ? "screwBadge 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards"
                                : "none",
                              opacity: 0,
                            } as React.CSSProperties
                          }
                          className="zkhome-badge electric-hover-trigger inline-flex items-center gap-1.5 bg-[#C98484] text-white shadow-md cursor-default transition-all border border-rose-400/30"
                        >
                          <ElectricBeamBorder radius={20} />
                          <span className="opacity-80 font-bold">//</span>{" "}
                          <span>{slider.badge_text.split("|")[0]}</span>
                        </div>
                      )}

                      {/* 2. Super Bold Title leading-none */}
                      {slider.heading
                        ?.split("\n")
                        .some((line: string) => line.split("|")[0]?.trim()) && (
                        <HeadingTag
                          className="zkhome-heading max-w-full font-medium normal-case select-none sm:drop-shadow-sm sm:hover:scale-[1.01] cursor-default"
                          style={{
                            animation: isActive
                              ? "drillHeading 1.1s cubic-bezier(0.25, 1, 0.5, 1) 0.1s forwards"
                              : "none",
                            opacity: 0,
                          }}
                        >
                          {renderHeading(
                            slider.heading,
                            slider.badge_color || highlightColor,
                            slider.text_color
                          )}
                        </HeadingTag>
                      )}

                      {/* 3. Subheading description */}
                      {slider.subheading?.split("|")[0]?.trim() && (
                        <p
                          className="zkhome-subheading max-w-lg font-normal leading-snug sm:leading-relaxed transition-colors"
                          style={{
                            color: textColor,
                            fontFamily: resolveSliderFont(
                              slider.subheading.split("|")[2],
                              "Inter"
                            ),
                            fontWeight: resolveSliderWeight(
                              slider.subheading.split("|")[3],
                              400
                            ),
                            animation: isActive
                              ? "rightFeatureDrill 0.85s cubic-bezier(0.19, 1, 0.22, 1) 0.25s forwards"
                              : "none",
                            opacity: 0,
                          }}
                        >
                          {slider.subheading.split("|")[0]}
                        </p>
                      )}

                      {/* 4. Bottom features list (Frosted Ice Glassmorphism with Traveling Border Beam) */}
                      {bottomFeatures.length > 0 && (
                        <div className="zkhome-bottom-features grid grid-cols-2 sm:grid-cols-4 w-full select-none max-w-xl">
                          {bottomFeatures.map((feat, fidx) => {
                            const isObj = typeof feat === "object"
                            const iconVal = isObj ? feat.icon : "bolt"

                            let titleWord = ""
                            let descWords = ""
                            if (isObj && feat.title) {
                              titleWord = feat.title
                              descWords = feat.desc || ""
                            } else {
                              const textVal: string = isObj
                                ? feat.text || ""
                                : feat || ""
                              const words = textVal.split(" ")
                              titleWord = words[0] || ""
                              descWords = words.slice(1).join(" ") || ""
                            }

                            return (
                              <React.Fragment key={fidx}>
                                <div
                                  className="zkhome-feature-item electric-hover-trigger relative flex items-center group/feat shadow-2xs backdrop-blur-md bg-white/80 border border-white/90 hover:border-[#C98484]/60 hover:bg-white/95 transition-all duration-300 cursor-pointer"
                                  style={{
                                    animation: isActive
                                      ? `screwFeature 0.75s cubic-bezier(0.19, 1, 0.22, 1) ${
                                          0.45 + fidx * 0.08
                                        }s forwards`
                                      : "none",
                                    opacity: 0,
                                  }}
                                >
                                  <ElectricBeamBorder radius={12} />
                                  <div
                                    className="zkhome-feature-icon-box flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-rose-50/90 border border-rose-100/80"
                                  >
                                    {iconVal &&
                                    (iconVal.startsWith("http") ||
                                      iconVal.startsWith("/")) ? (
                                      <img
                                        src={iconVal}
                                        alt=""
                                        width={20}
                                        height={20}
                                        className="zkhome-feature-icon object-contain"
                                      />
                                    ) : (
                                      <DynamicIcon
                                        name={iconVal}
                                        className="zkhome-feature-icon text-[#C98484] transition-colors duration-300"
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-col text-left flex-1 min-w-0 pr-1">
                                    <span
                                      className="zkhome-feature-title font-bold leading-tight line-clamp-1 text-gray-900 transition-colors duration-300"
                                      style={{
                                        fontSize:
                                          (isObj && feat.fontSize) || undefined,
                                      }}
                                    >
                                      {titleWord}
                                    </span>
                                    {descWords && (
                                      <span
                                        className="zkhome-feature-desc hidden min-[360px]:block font-medium mt-0.5 leading-tight line-clamp-1 text-gray-500 transition-colors duration-300"
                                      >
                                        {descWords}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </React.Fragment>
                            )
                          })}
                        </div>
                      )}

                      {/* 5. Buttons Section (Primary color, secondary outline transparent) */}
                      <div className="zkhome-buttons-container flex flex-wrap items-center">
                        {slider.button_link && slider.button_text && (
                          <LocalizedClientLink
                            href={resolveSlideLink(slider.button_link)}
                            tabIndex={isActive ? 0 : -1}
                            style={{
                              backgroundColor: highlightColor,
                              color: sliderForeground(highlightColor),
                              animation: isActive
                                ? `nailButton 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.7s forwards`
                                : "none",
                              opacity: 0,
                            }}
                            className="zkhome-slide-btn electric-hover-trigger electric-hover-trigger-primary flex items-center justify-center border-none font-extrabold uppercase shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-102 hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            <span>{slider.button_text}</span>
                            <ArrowRight
                              aria-hidden="true"
                              strokeWidth={2.5}
                            />
                          </LocalizedClientLink>
                        )}
                        {showSecondaryButton && (
                          <LocalizedClientLink
                            href={resolveSlideLink(slider.button2_link)}
                            tabIndex={isActive ? 0 : -1}
                            style={
                              {
                                backgroundColor: secondaryButtonColor,
                                color: sliderForeground(secondaryButtonColor),
                                animation: isActive
                                  ? `nailButton 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.8s forwards`
                                  : "none",
                                opacity: 0,
                              } as React.CSSProperties
                            }
                            className="zkhome-slide-btn electric-hover-trigger flex items-center justify-center border border-slate-300/90 bg-white/85 font-extrabold uppercase text-slate-900 shadow-2xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-102 hover:border-slate-400 hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <ElectricBeamBorder radius={12} />
                            <span>{slider.button2_text}</span>
                            <ArrowRight
                              aria-hidden="true"
                            />
                          </LocalizedClientLink>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Specifications with clean frosted glassmorphism & traveling border beam */}
                    <div className="absolute right-3 sm:right-6 lg:right-8 xl:right-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-end z-20">
                      {rightFeaturesList.length > 0 && (
                        <div
                          className="electric-hover-trigger backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl w-[190px] xl:w-[215px] flex flex-col gap-0 shadow-xl border border-white/85 bg-white/80 dark:bg-black/50 text-slate-900 dark:text-white"
                          style={
                            {
                              animation: isActive
                                ? "rightFeatureDrill 0.9s cubic-bezier(0.19, 1, 0.22, 1) 0.5s forwards"
                                : "none",
                              opacity: 0,
                            } as React.CSSProperties
                          }
                        >
                          <ElectricBeamBorder radius={16} />
                          {rightFeaturesList.map((rf, rfidx) => (
                            <div
                              key={rfidx}
                              className="flex items-center gap-2.5 border-b border-slate-200/60 last:border-none py-2.5 first:pt-0 last:pb-0 hover:translate-x-1 transition-transform duration-300 cursor-pointer group/rightfeat"
                            >
                              {rf.icon &&
                              (rf.icon.startsWith("http") ||
                                rf.icon.startsWith("/")) ? (
                                <img
                                  src={rf.icon}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 object-contain transition-transform duration-300 group-hover:scale-110 shrink-0"
                                />
                              ) : (
                                <DynamicIcon
                                  name={rf.icon || "bolt"}
                                  className="w-6 h-6 text-[#C98484] transition-transform duration-300 shrink-0"
                                />
                              )}
                              <div className="text-left min-w-0">
                                <p
                                  className="font-semibold text-xs leading-none text-slate-900 transition-colors duration-300"
                                  style={{ fontSize: rf.fontSize || undefined }}
                                >
                                  {rf.title}
                                </p>
                                <p
                                  className="text-[10px] font-medium mt-1 leading-none text-slate-500"
                                >
                                  {rf.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Compact pagination on mobile; desktop keeps the original left alignment. */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-8 sm:left-8 sm:translate-x-0 md:left-16">
        {sliders.map((_, index) => (
          <button
            key={index}
            className="group/dot grid h-6 w-7 place-items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            onClick={() => scrollTo(index)}
            aria-label={`${index + 1}. slayta git`}
            aria-current={index === selectedIndex ? "true" : undefined}
          >
            <span
              aria-hidden="true"
              className={`h-2 rounded-full border border-slate-400/30 bg-slate-400/45 transition-all duration-300 group-hover/dot:bg-slate-500/70 ${
                index === selectedIndex ? "w-7" : "w-2"
              }`}
              style={{
                backgroundColor:
                  index === selectedIndex
                    ? sliders[selectedIndex]?.button_color || "#C98484"
                    : undefined,
              }}
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggleAutoplay}
        aria-label={paused ? "Slaytı oynat" : "Slaytı duraklat"}
        aria-pressed={paused}
        className="absolute bottom-7 right-8 z-20 hidden h-10 w-10 items-center justify-center rounded-circle border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
      >
        {!paused ? (
          <Pause aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Play aria-hidden="true" className="h-4 w-4" />
        )}
      </button>

      {/* Navigation Arrows with outline circles */}
      <button
        type="button"
        aria-label="Önceki slayt"
        className="absolute left-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-circle border border-white/20 bg-black/30 text-white opacity-0 backdrop-blur-sm transition-all hover:border-primary hover:bg-primary hover:text-white focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100 sm:flex"
        onClick={() => scrollTo(selectedIndex - 1)}
      >
        <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label="Sonraki slayt"
        className="absolute right-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-circle border border-white/20 bg-black/30 text-white opacity-0 backdrop-blur-sm transition-all hover:border-primary hover:bg-primary hover:text-white focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100 sm:flex"
        onClick={() => scrollTo(selectedIndex + 1)}
      >
        <ArrowRight aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
