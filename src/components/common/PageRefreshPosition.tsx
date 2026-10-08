"use client"

import { useEffect } from "react"

export default function PageRefreshPosition() {
  useEffect(() => {
    const key = () => `zk:scroll:${location.pathname}${location.search}${location.hash}`
    const save = () => {
      try { sessionStorage.setItem(key(), JSON.stringify([window.scrollX, window.scrollY])) } catch {}
    }
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
    let timer: ReturnType<typeof setInterval> | undefined
    const stop = () => { if (timer) clearInterval(timer) }
    if (navigation?.type === "reload") {
      try {
        const position = JSON.parse(sessionStorage.getItem(key()) || "null")
        if (Array.isArray(position) && position.length === 2 && position.every(n => Number.isFinite(n) && n >= 0)) {
          const started = Date.now()
          timer = setInterval(() => {
            window.scrollTo({ left: position[0], top: position[1], behavior: "instant" })
            if (Math.abs(window.scrollY - position[1]) < 2 || Date.now() - started > 5000) stop()
          }, 100)
        }
      } catch {}
    }
    window.addEventListener("pagehide", save)
    window.addEventListener("beforeunload", save)
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const
    events.forEach(event => window.addEventListener(event, stop, { passive: true }))
    return () => {
      stop()
      window.removeEventListener("pagehide", save)
      window.removeEventListener("beforeunload", save)
      events.forEach(event => window.removeEventListener(event, stop))
    }
  }, [])
  return null
}
