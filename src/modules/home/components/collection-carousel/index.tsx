"use client"

import { Children, useEffect, useState, type ReactNode } from "react"
import useFadeSlider from "../use-fade-slider"

export default function CollectionCarousel({ children, count }: { children: ReactNode; count: number }) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const update = () => setMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  const { activeIndex, gestures } = useFadeSlider(count, mobile, 6000)
  return <div className="collection-carousel" role="region" aria-label="Koleksiyon kartları" aria-roledescription={mobile ? "carousel" : undefined} {...gestures} onMouseEnter={undefined} onMouseLeave={undefined}>
    <div className="overflow-hidden">
      <div className="collection-carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {Children.map(children, (child, index) => <div className="collection-carousel-item" aria-hidden={mobile && index !== activeIndex ? true : undefined} inert={mobile && index !== activeIndex}>
          {child}
        </div>)}
      </div>
    </div>
  </div>
}
