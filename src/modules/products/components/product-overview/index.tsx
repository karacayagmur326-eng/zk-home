"use client"

import { useEffect, useRef, type ReactNode } from "react"

export default function ProductOverview({ gallery, children }: { gallery: ReactNode; children: ReactNode }) {
  const overview = useRef<HTMLDivElement>(null)
  const media = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = overview.current
    const gallery = media.current
    if (!container || !gallery) return
    const measure = () => {
      const height = gallery.getBoundingClientRect().height
      if (height > 0) container.style.setProperty("--product-gallery-height", `${height}px`)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(gallery)
    measure()
    return () => observer.disconnect()
  }, [])

  return <div ref={overview} className="product-overview space-y-3 sm:space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:gap-8 lg:space-y-0 lg:pb-6">
    <div ref={media} className="min-w-0">{gallery}</div>
    <div className="product-overview-details min-w-0 flex flex-col">{children}</div>
  </div>
}
