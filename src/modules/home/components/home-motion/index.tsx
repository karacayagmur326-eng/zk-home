"use client"

import { useEffect, useRef, type ReactNode } from "react"
import useMotionEnabled from "../use-motion-enabled"

export default function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const enabled = useMotionEnabled()
  useEffect(() => {
    const container = root.current
    if (!container || !enabled || !('IntersectionObserver' in window)) return
    const items = Array.from(container.querySelectorAll<HTMLElement>("section > div:first-child, section > .grid > *, section[aria-label] > .relative"))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const node = entry.target as HTMLElement
        node.classList.remove("home-motion-pending")
        node.classList.add("home-motion-visible")
        observer.unobserve(node)
      })
    }, { threshold: 0.05 })
    items.forEach((node) => {
      // Above-the-fold content stays immediately readable, even before hydration.
      if (node.getBoundingClientRect().top < window.innerHeight) return
      const siblings = Array.from(node.parentElement?.children || [])
      node.style.setProperty("--home-motion-delay", `${Math.min(siblings.indexOf(node), 4) * 80}ms`)
      node.classList.add("home-motion-pending")
      observer.observe(node)
    })
    const revealAll = () => items.forEach((node) => node.classList.remove("home-motion-pending"))
    return () => { observer.disconnect(); revealAll() }
  }, [enabled])
  return <div ref={root}>{children}</div>
}
