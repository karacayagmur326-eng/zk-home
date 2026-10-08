"use client"

import { Container, clx } from "@modules/common/components/ui"
import Image from "@components/common/SmartImage"
import React, { useEffect, useRef, useState } from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  imageClassName?: string
  alt?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  imageClassName,
  alt = "Ürün görseli",
  "data-testid": dataTestid,
}) => {
  const [secondaryRequested, setSecondaryRequested] = useState(false)
  const [secondaryReady, setSecondaryReady] = useState(false)
  const [active, setActive] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const initialImage = thumbnail || images?.[0]?.url
  const secondaryImage = images
    ?.map((image) => image.url)
    .find((url) => Boolean(url) && url !== initialImage)

  useEffect(() => {
    setSecondaryRequested(false)
    setSecondaryReady(false)
    setActive(false)
    // Card thumbnails can ignore pointer events; listen on their image link.
    const target = rootRef.current?.closest("a") || rootRef.current
    if (!target || !secondaryImage) return
    let hovered = false
    let focused = false
    const update = () => {
      setActive(hovered || focused)
      if (hovered || focused) setSecondaryRequested(true)
    }
    const enter = () => {
      hovered = true
      update()
    }
    const leave = () => {
      hovered = false
      update()
    }
    const focus = () => {
      focused = true
      update()
    }
    const blur = () => {
      focused = false
      update()
    }
    target.addEventListener("mouseenter", enter)
    target.addEventListener("mouseleave", leave)
    target.addEventListener("focusin", focus)
    target.addEventListener("focusout", blur)
    return () => {
      target.removeEventListener("mouseenter", enter)
      target.removeEventListener("mouseleave", leave)
      target.removeEventListener("focusin", focus)
      target.removeEventListener("focusout", blur)
    }
  }, [initialImage, secondaryImage])

  return (
    <div
      ref={rootRef}
      className={clx(
        "group relative w-full overflow-hidden bg-transparent transition-all duration-200",
        className,
        {
          "aspect-[4/5]": true,
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full" || size === "square",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder
        image={initialImage}
        size={size}
        alt={alt}
        className={clx("transition-opacity duration-300", imageClassName, secondaryImage && secondaryReady && active && "opacity-0")}
      />
      {secondaryImage && secondaryRequested && (
        <ImageOrPlaceholder
          image={secondaryImage}
          size={size}
          alt={`${alt} - alternatif görünüm`}
          onLoad={() => setSecondaryReady(true)}
          className={clx(
            "transition-all duration-300",
            imageClassName,
            secondaryReady && active ? "opacity-100 scale-[1.02]" : "opacity-0"
          )}
        />
      )}
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  className,
  alt,
  onLoad,
}: Pick<ThumbnailProps, "size" | "alt"> & {
  image?: string
  className?: string
  onLoad?: () => void
}) => {
  return image ? (
    <Image
      src={image}
      alt={alt || "Ürün görseli"}
      className={clx("absolute inset-0 object-contain object-center p-0.5", className)}
      draggable={false}
      quality={75}
      fetchPriority="low"
      sizes={
        size === "small"
          ? "180px"
          : size === "medium"
            ? "290px"
            : size === "large"
              ? "440px"
              : "(max-width: 639px) 30vw, (max-width: 1023px) 31vw, 220px"
      }
      onLoad={onLoad}
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
