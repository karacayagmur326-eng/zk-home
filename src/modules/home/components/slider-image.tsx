"use client"

import { useEffect, useRef, useState } from "react"
import type { ImageProps } from "next/image"
import Image from "@components/common/SmartImage"

export default function SliderImage({ src, onLoad, ...props }: ImageProps & { src: string }) {
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
        onLoad={(event) => {
          setLoadedSource(src)
          onLoad?.(event)
        }}
      />
    </div>
  )
}
