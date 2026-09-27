"use client"

import React, { useState } from "react"

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt?: string
  fallbackSrc?: string
}

export function SafeImage({ src, alt = "", className, style, fallbackSrc, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed && !fallbackSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-rose-50/80 text-[#C98484] font-bold text-[10px] ${className || ""}`}
        style={{ width: "100%", height: "100%", ...style }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    )
  }

  return (
    <img
      {...props}
      src={failed && fallbackSrc ? fallbackSrc : src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        const target = e.currentTarget
        if (!target.dataset.retried) {
          target.dataset.retried = "true"
          const delimiter = src.includes("?") ? "&" : "?"
          target.src = `${src}${delimiter}retry=${Date.now()}`
        } else {
          setFailed(true)
        }
      }}
    />
  )
}
