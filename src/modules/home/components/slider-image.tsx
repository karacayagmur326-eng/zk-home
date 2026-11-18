"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import type { ImageProps } from "next/image"
import Image from "@components/common/SmartImage"
import { sliderBlurMask, sliderTransitions, sliderTransitionMask, type SliderTransitions } from "@lib/content/slider-reveal"

export default function SliderImage({ src, onLoad, imageRevealEnd, imageRevealSettings, imageRevealEnabled = true, ...props }: ImageProps & { src: string; imageRevealEnd?: number; imageRevealSettings?: SliderTransitions; imageRevealEnabled?: boolean }) {
  const [loadedSource, setLoadedSource] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transitions = sliderTransitions(imageRevealSettings, imageRevealEnd)
  useEffect(() => {
    const image = containerRef.current?.querySelector("img")
    if (image?.complete && image.naturalWidth > 0) setLoadedSource(src)
  }, [src])

  return (
    <div ref={containerRef} className="zkhome-slide-image absolute inset-0" data-ready={loadedSource === src}>
      <Image
        {...props}
        src={src}
        style={{ ...props.style, "--slider-reveal-mask": imageRevealEnabled ? sliderTransitionMask(imageRevealSettings, imageRevealEnd) : "none", maskComposite: "intersect", WebkitMaskComposite: "source-in" } as CSSProperties}
        onLoad={(event) => {
          setLoadedSource(src)
          onLoad?.(event)
        }}
      />
      {imageRevealEnabled && (["left", "right"] as const).map(side => transitions[side].blur > 0 && (
        <Image
          {...props}
          key={side}
          src={src}
          alt=""
          aria-hidden="true"
          className={`${props.className || ""} hidden md:block`}
          style={{ ...props.style, filter: `blur(${transitions[side].blur}px)`, "--slider-reveal-mask": sliderBlurMask(transitions, side), maskComposite: "intersect", WebkitMaskComposite: "source-in", pointerEvents: "none" } as CSSProperties}
        />
      ))}
    </div>
  )
}
