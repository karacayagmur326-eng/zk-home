"use client"

import NextImage, { type ImageProps } from "next/image"
import { useState } from "react"

export default function SmartImage(props: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null)
  // Versioned hero panoramas are already compressed WebP assets (under 300 KB).
  // Share this policy across desktop, mobile and the admin preview.
  const preparedPanorama = typeof props.src === "string" && /^\/hero\/(?:vase-room-complete-v1|gold-table-panorama-v1|butterfly-room-panorama-v1)\.webp$/.test(props.src)
  const unoptimized = props.unoptimized || preparedPanorama || failedSource === props.src

  return <NextImage {...props} unoptimized={unoptimized} onError={event => {
    // A quota or upstream optimizer failure must not hide an available image.
    if (!unoptimized) setFailedSource(props.src)
    props.onError?.(event)
  }} />
}
