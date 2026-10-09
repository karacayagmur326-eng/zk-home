"use client"

import { useEffect, useRef, useState } from "react"
import type { ImageProps } from "next/image"
import Image from "@components/common/SmartImage"

export default function SliderImage({ src, onLoad, tintColor, ...props }: ImageProps & { src: string; tintColor?: string }) {
  const [loadedSource, setLoadedSource] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageStart, setImageStart] = useState(0)
  useEffect(() => {
    const container = containerRef.current
    const image = container?.querySelector("img")
    if (!container || !image) return
    const measure = () => {
      const bounds = container.getBoundingClientRect()
      if (bounds.width > 0) {
        const start = (image.getBoundingClientRect().left - bounds.left) / bounds.width * 100
        setImageStart(Math.max(0, Math.min(100, start)))
      }
      if (image.complete && image.naturalWidth > 0) setLoadedSource(src)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(image)
    image.addEventListener("load", measure)
    measure()
    return () => {
      observer.disconnect()
      image.removeEventListener("load", measure)
    }
  }, [src])

  return (
    <div ref={containerRef} className="zkhome-slide-image absolute inset-0" data-ready={loadedSource === src}>
      <Image
        {...props}
        src={src}
        onLoad={(event) => {
          setLoadedSource(src)
          onLoad?.(event)
        }}
      />
      {tintColor && (
        <>
          <div className="zkhome-desktop-gradient absolute inset-0 z-10 hidden md:block pointer-events-none" style={{
            background: `linear-gradient(90deg, ${tintColor} 0%, ${tintColor} ${imageStart}%, ${tintColor}CC ${imageStart + (100 - imageStart) * 0.2}%, ${tintColor}00 ${imageStart + (100 - imageStart) * 0.65}%)`,
            mixBlendMode: "multiply",
          }} />
          <div className="zkhome-edge-gradient absolute inset-0 z-[11] hidden md:block pointer-events-none" style={{
            background: `linear-gradient(90deg, ${tintColor} 0%, ${tintColor} ${imageStart}%, ${tintColor}00 ${imageStart + (100 - imageStart) * 0.13}%)`,
          }} />
        </>
      )}
    </div>
  )
}
