"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import type { ImageProps } from "next/image"
import Image from "@components/common/SmartImage"
import { sliderRevealEnd } from "@lib/content/slider-reveal"

export default function SliderImage({ src, onLoad, imageRevealEnd, ...props }: ImageProps & { src: string; imageRevealEnd?: number }) {
  const [loadedSource, setLoadedSource] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const image = containerRef.current?.querySelector("img")
    if (image?.complete && image.naturalWidth > 0) setLoadedSource(src)
  }, [src])

  return (
    <div ref={containerRef} className="zkhome-slide-image absolute inset-0" data-ready={loadedSource === src}>
      <Image
        {...props}
        src={src}
        style={{ ...props.style, "--slider-reveal-mask": `linear-gradient(90deg, transparent 0%, #000 ${sliderRevealEnd(imageRevealEnd)}%, #000 100%)` } as CSSProperties}
        onLoad={(event) => {
          setLoadedSource(src)
          onLoad?.(event)
        }}
      />
    </div>
  )
}
