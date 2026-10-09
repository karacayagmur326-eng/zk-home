"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import type { ImageProps } from "next/image"
import Image from "@components/common/SmartImage"
import { sliderRevealEnd } from "@lib/content/slider-reveal"

export default function SliderImage({ src, onLoad, imageRevealEnd, imageRevealEnabled = true, ...props }: ImageProps & { src: string; imageRevealEnd?: number; imageRevealEnabled?: boolean }) {
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
        style={{ ...props.style, "--slider-reveal-mask": imageRevealEnabled ? `linear-gradient(90deg, transparent 0%, #000 ${sliderRevealEnd(imageRevealEnd)}%, #000 100%), linear-gradient(90deg, #000 calc(100% - min(8%, 128px)), transparent 100%)` : "none", maskComposite: "intersect", WebkitMaskComposite: "source-in" } as CSSProperties}
        onLoad={(event) => {
          setLoadedSource(src)
          onLoad?.(event)
        }}
      />
    </div>
  )
}
