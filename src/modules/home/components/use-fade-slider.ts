"use client"

import { useEffect, useRef, useState, type TouchEvent } from "react"
import useMotionEnabled from "./use-motion-enabled"

export default function useFadeSlider(count: number, autoplay = true, intervalMs = 5000) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const motionEnabled = useMotionEnabled()
  const [visible, setVisible] = useState(true)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const isPlaying = autoplay && count > 1 && !paused && !hovered && !focused && motionEnabled && visible

  useEffect(() => {
    const updateVisibility = () => setVisible(document.visibilityState === "visible")
    updateVisibility()
    document.addEventListener("visibilitychange", updateVisibility)
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility)
    }
  }, [])

  useEffect(() => { setActiveIndex(0) }, [count])
  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setTimeout(() => setActiveIndex((index) => (index + 1) % count), intervalMs)
    return () => window.clearTimeout(timer)
  }, [isPlaying, activeIndex, count, intervalMs])

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
