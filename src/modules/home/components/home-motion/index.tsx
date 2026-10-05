"use client"

import { useEffect, useRef, type ReactNode } from "react"

export default function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = root.current
    if (!container || !('IntersectionObserver' in window)) return
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (preference.matches) return
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
    const onPreference = () => { if (preference.matches) { observer.disconnect(); revealAll() } }
    preference.addEventListener("change", onPreference)
    return () => { observer.disconnect(); revealAll(); preference.removeEventListener("change", onPreference) }
  }, [])
  return <div ref={root}>{children}</div>
}
