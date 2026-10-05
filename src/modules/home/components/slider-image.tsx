"use client"

import { useState } from "react"
import type { ImageProps } from "next/image"
import Image from "@components/common/SmartImage"

export default function SliderImage({ src, onLoad, ...props }: ImageProps & { src: string }) {
  const [loadedSource, setLoadedSource] = useState<string | null>(null)

  return (
    <div className="zkhome-slide-image absolute inset-0" data-ready={loadedSource === src}>
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
