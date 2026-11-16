"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import ProductStageSlider from "@modules/home/components/product-stage-slider"

export default function SliderPreview({
  slider,
  onImageAreaSize,
  onFieldClick,
}: {
  slider: any
  onImageAreaSize?: (size: { width: number; height: number }) => void
  onFieldClick?: (field: string) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [root, setRoot] = useState<ShadowRoot | null>(null)
  const [fileSize, setFileSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" })
    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      shadow.appendChild(node.cloneNode(true))
    })
    setRoot(shadow)
    return () => {
      shadow.replaceChildren()
    }
  }, [])

  useEffect(() => {
    if (!frameRef.current || !hostRef.current) return
    const frame = frameRef.current
    const host = hostRef.current

    const measure = () => {
      const BASE_WIDTH = 1440
      const BASE_HEIGHT = 720
      host.style.width = `${BASE_WIDTH}px`
      const scale = frame.clientWidth / BASE_WIDTH
      host.style.transform = `scale(${scale})`
      frame.style.height = `${BASE_HEIGHT * scale}px`
      if (onImageAreaSize) {
        onImageAreaSize({ width: BASE_WIDTH, height: BASE_HEIGHT })
      }
    }

    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    window.addEventListener("resize", measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [onImageAreaSize])

  useEffect(() => {
    setFileSize(null)
    if (!slider.image_url) return
    const image = new window.Image()
    image.onload = () => setFileSize({ width: image.naturalWidth, height: image.naturalHeight })
    image.src = slider.image_url
    return () => {
      image.onload = null
    }
  }, [slider.image_url])

  return (
    <>
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 shadow-md bg-[#f5eadc] group select-none"
      >
        <div
          ref={hostRef}
          style={{
            transformOrigin: "top left",
            pointerEvents: onFieldClick ? "auto" : "none",
          }}
        >
          {root &&
            createPortal(
              <div data-ui-scope="storefront">
                <ProductStageSlider
                  slide={slider}
                  autoplay={false}
                  forceIndex={0}
                  onFieldClick={onFieldClick}
                />
              </div>,
              root
            )}
        </div>
      </div>
      {fileSize && (
        <p className="mt-2 text-[11px] text-slate-500 font-medium">
          Görsel çözünürlüğü: {fileSize.width} × {fileSize.height} px
        </p>
      )}
    </>
  )
}
