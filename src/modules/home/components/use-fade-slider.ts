"use client"

import { useEffect, useRef, useState, type TouchEvent } from "react"

export default function useFadeSlider(count: number, autoplay = true) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [visible, setVisible] = useState(true)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const isPlaying = autoplay && count > 1 && !paused && !hovered && !focused && !reducedMotion && visible

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotion = () => setReducedMotion(preference.matches)
    const updateVisibility = () => setVisible(document.visibilityState === "visible")
    updateMotion()
    updateVisibility()
    preference.addEventListener("change", updateMotion)
    document.addEventListener("visibilitychange", updateVisibility)
    return () => {
      preference.removeEventListener("change", updateMotion)
      document.removeEventListener("visibilitychange", updateVisibility)
    }
  }, [])

  useEffect(() => { setActiveIndex(0) }, [count])
  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setTimeout(() => setActiveIndex((index) => (index + 1) % count), 5000)
    return () => window.clearTimeout(timer)
  }, [isPlaying, activeIndex, count])

  const select = (index: number) => { if (count) setActiveIndex((index + count) % count) }
  const gestures = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocusCapture: () => setFocused(true),
    onBlurCapture: (event: React.FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
    },
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      const first = event.touches[0]
      touch.current = first ? { x: first.clientX, y: first.clientY } : null
    },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      const last = event.changedTouches[0]
      const start = touch.current
      touch.current = null
      if (!start || !last) return
      const dx = last.clientX - start.x
      const dy = last.clientY - start.y
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        event.preventDefault()
        select(activeIndex + (dx < 0 ? 1 : -1))
      }
    },
    onTouchCancel: () => { touch.current = null },
  }

  return { activeIndex, select, isPlaying, paused, toggle: () => setPaused((value) => !value), gestures }
}
