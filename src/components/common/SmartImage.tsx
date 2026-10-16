"use client"

import NextImage, { type ImageProps } from "next/image"
import { useState } from "react"

export default function SmartImage(props: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null)
  const unoptimized = props.unoptimized || failedSource === props.src

  return <NextImage {...props} unoptimized={unoptimized} onError={event => {
    // A quota or upstream optimizer failure must not hide an available image.
    if (!unoptimized) setFailedSource(props.src)
    props.onError?.(event)
  }} />
}
