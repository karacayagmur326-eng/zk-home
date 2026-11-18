"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { browserAnalyticsAllowed } from "@lib/analytics/traffic-policy"

export default function AnalyticsRuntime({ head, body, insights }: { head?: string; body?: string; insights: boolean }) {
  const pathname = usePathname()
  const host = useRef<HTMLDivElement>(null)
  const [allowed, setAllowed] = useState(false)
  useEffect(() => {
    setAllowed(browserAnalyticsAllowed())
  }, [pathname])
  useEffect(() => {
    const target = host.current
    if (!allowed || !target) return
    // Preserve administrator-provided snippets, but never execute them for
    // admin, preview, local, or debug traffic just to make the HTML cacheable.
    const range = document.createRange()
    range.selectNodeContents(target)
    target.append(range.createContextualFragment([head, body].filter(Boolean).join("\n")))
    return () => target.replaceChildren()
  }, [allowed, head, body])
  return <><div ref={host} style={{ display: "contents" }} />{allowed && insights && <SpeedInsights />}</>
}
