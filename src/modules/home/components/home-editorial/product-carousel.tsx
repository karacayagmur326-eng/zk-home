"use client"

import { Children, useEffect, useId, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react"
import useMotionEnabled, { enableSiteMotion } from "../use-motion-enabled"

export default function EditorialProductCarousel({ intro, children, label = "Öne çıkan ürünler", linkLabel = "Keşfet" }: { intro: ReactNode; children: ReactNode; label?: string; linkLabel?: string }) {
  const carouselId = useId()
  const cards = Children.toArray(children)
  const viewport = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLDivElement>(null)
  const cycle = useRef(0)
  const manualUntil = useRef(0)
  const hovered = useRef(false)
  const focused = useRef(false)
  const paused = useRef(false)
  const touching = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const motionEnabled = useMotionEnabled()

  useEffect(() => {
    const rail = viewport.current
    const root = section.current
    if (!rail || !root || cards.length < 2) return
    let visible = false
    let previousTime = 0
    let position = 0
    let frame = 0
    const measure = () => {
      const first = rail.querySelector<HTMLElement>("[data-product-copy='0']")
      const next = rail.querySelector<HTMLElement>("[data-product-copy='1']")
      const width = first && next ? next.offsetLeft - first.offsetLeft : 0
      cycle.current = width >= rail.clientWidth ? width : 0
      if (cycle.current) rail.scrollLeft = position = cycle.current
    }
    const resize = new ResizeObserver(measure)
    resize.observe(rail)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: .05 })
    observer.observe(root)
    measure()
    const animate = (time: number) => {
      const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0
      previousTime = time
      if (cycle.current && visible && !document.hidden && !paused.current && !touching.current && !hovered.current && !focused.current && motionEnabled && time > manualUntil.current) {
        // Increasing scrollLeft moves the cards automatically to the left.
        position += elapsed * .025
        if (position < cycle.current) position += cycle.current
        else if (position >= cycle.current * 2) position -= cycle.current
        rail.scrollLeft = position
      } else position = rail.scrollLeft
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect() }
  }, [cards.length, motionEnabled])

  function step(direction: number) {
    const rail = viewport.current
    if (!rail) return
    manualUntil.current = performance.now() + 1200
    if (cycle.current && rail.scrollLeft < cycle.current / 2) rail.scrollLeft += cycle.current
    if (cycle.current && rail.scrollLeft > cycle.current * 2) rail.scrollLeft -= cycle.current
    const first = rail.querySelector<HTMLElement>("[data-product-card]")
    const gap = parseFloat(getComputedStyle(rail.firstElementChild!).gap) || 0
    rail.scrollBy({ left: direction * ((first?.offsetWidth || 240) + gap), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  }

  const controlClass = "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-white text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
  return <div ref={section}
    onPointerEnter={event => { hovered.current = event.pointerType === "mouse" }}
    onPointerLeave={() => { hovered.current = false }}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      {intro}
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" className={controlClass} onClick={() => step(-1)} aria-label={`${label} sola kaydır`} aria-controls={carouselId}><ArrowLeft size={16} aria-hidden="true" /></button>
        <button type="button" className={controlClass} onClick={() => step(1)} aria-label={`${label} sağa kaydır`} aria-controls={carouselId}><ArrowRight size={16} aria-hidden="true" /></button>
        <button type="button" className={controlClass} onClick={() => { paused.current = !paused.current; if (!paused.current) enableSiteMotion(); setIsPaused(paused.current) }} aria-label={isPaused ? "Otomatik ürün kaymasını başlat" : "Otomatik ürün kaymasını duraklat"} aria-pressed={isPaused}>
          {isPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        </button>
        <Link href="/magaza" className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-hover">{linkLabel}<ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
    </div>
    <div ref={viewport} id={carouselId} role="region" aria-label={label} aria-roledescription="Ürün kaydırıcısı" className="home-featured-carousel no-scrollbar overflow-x-auto"
      onFocusCapture={event => { focused.current = event.target.matches(":focus-visible") }}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) focused.current = false }}
      onTouchStart={() => { touching.current = true; hovered.current = false; focused.current = false }}
      onTouchEnd={() => { touching.current = false; manualUntil.current = performance.now() + 1800 }}
      onTouchCancel={() => { touching.current = false; manualUntil.current = performance.now() + 1800 }}>
      <div className="relative flex items-stretch gap-2 pb-5 sm:gap-4">
        {[0, 1, 2].map(copy => cards.map((card, index) => <div key={`${copy}-${index}`} data-product-card data-product-copy={copy} className="home-featured-carousel-card min-w-0 shrink-0">{card}</div>))}
      </div>
    </div>
  </div>
}
