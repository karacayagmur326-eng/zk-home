"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import HeroSlider from "@modules/home/components/hero-slider"

export default function SliderPreview({ slider, onImageAreaSize }: {
  slider: any
  onImageAreaSize: (size: { width: number; height: number }) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [root, setRoot] = useState<ShadowRoot | null>(null)
  const [fileSize, setFileSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" })
    // Storefront styles apply inside this boundary without admin ancestor selectors.
    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      shadow.appendChild(node.cloneNode(true))
    })
    setRoot(shadow)
    return () => { shadow.replaceChildren() }
  }, [])

  useEffect(() => {
    if (!root || !frameRef.current || !hostRef.current) return
    const frame = frameRef.current
    const host = hostRef.current
    const measure = () => {
      host.style.width = `${document.documentElement.clientWidth}px`
      const carousel = root.querySelector<HTMLElement>('[aria-roledescription="carousel"]')
      const area = root.querySelector<HTMLElement>(".zkhome-slide-body")
      if (!carousel?.offsetWidth || !area?.offsetHeight) return
      const scale = frame.clientWidth / carousel.offsetWidth
      host.style.transform = `scale(${scale})`
      frame.style.height = `${carousel.offsetHeight * scale}px`
      onImageAreaSize({ width: area.offsetWidth, height: area.offsetHeight })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    observer.observe(host)
    root.querySelectorAll('[aria-roledescription="carousel"], .zkhome-slide-body').forEach(node => observer.observe(node))
    window.addEventListener("resize", measure)
    measure()
    return () => { observer.disconnect(); window.removeEventListener("resize", measure) }
  }, [root, slider.image_url, onImageAreaSize])

  useEffect(() => {
    setFileSize(null)
    if (!slider.image_url) return
    const image = new window.Image()
    image.onload = () => setFileSize({ width: image.naturalWidth, height: image.naturalHeight })
    image.src = slider.image_url
    return () => { image.onload = null }
  }, [slider.image_url])

  return <>
    <div ref={frameRef} className="relative w-full overflow-hidden rounded-xl border border-gray-200">
      <div ref={hostRef} style={{ transformOrigin: "top left", pointerEvents: "none" }}>
        {root && createPortal(<div data-ui-scope="storefront"><HeroSlider initialSliders={[slider]} /></div>, root)}
      </div>
    </div>
    {fileSize && <p className="mt-2 text-[11px] text-gray-500">Yüklü dosya: {fileSize.width} × {fileSize.height} px</p>}
  </>
}
