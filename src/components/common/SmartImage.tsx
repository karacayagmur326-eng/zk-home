"use client"

import NextImage, { type ImageProps } from "next/image"
import { useState } from "react"
import { preparedImage, preparedImagePath } from "@lib/media/prepared-images"

export default function SmartImage(props: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null)
  const prepared = preparedImage(props.src)
  const src = prepared ? preparedImagePath(prepared) : props.src
  // These local WebP collections are already compressed. Product copies use
  // prebuilt responsive sizes, so neither path needs a paid image transform.
  const preparedLocal = typeof src === "string" && /^\/(?:hero|category-images|editorial)\/.*\.webp(?:\?.*)?$/.test(src)
  const unoptimized = props.unoptimized || preparedLocal || failedSource === props.src

  return <NextImage {...props} src={src} loader={prepared ? ({ width }) => preparedImagePath(prepared, width) : props.loader} unoptimized={unoptimized} onError={event => {
    // A quota or upstream optimizer failure must not hide an available image.
    if (!unoptimized && !prepared) setFailedSource(props.src)
    props.onError?.(event)
  }} />
}
