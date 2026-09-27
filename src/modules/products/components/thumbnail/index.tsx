"use client"

import { Container, clx } from "@modules/common/components/ui"
import Image from "@components/common/SmartImage"
import React, { useState } from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  alt?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  alt = "Ürün görseli",
  "data-testid": dataTestid,
}) => {
  const [secondaryRequested, setSecondaryRequested] = useState(false)
  const [secondaryReady, setSecondaryReady] = useState(false)
  const initialImage = thumbnail || images?.[0]?.url
  const secondaryImage = images
    ?.map((image) => image.url)
    .find((url) => Boolean(url) && url !== initialImage)

  return (
    <div
      className={clx(
        "group relative w-full overflow-hidden bg-transparent transition-all duration-200",
        className,
        {
          "aspect-square": isFeatured || size === "square" || size === "full",
          "aspect-[9/16]": !isFeatured && size !== "square" && size !== "full",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full" || size === "square",
        }
      )}
      data-testid={dataTestid}
      onMouseEnter={() => setSecondaryRequested(true)}
      onFocus={() => setSecondaryRequested(true)}
    >
      <ImageOrPlaceholder
        image={initialImage}
        size={size}
        alt={alt}
        className={secondaryImage && secondaryReady ? "transition-opacity duration-300 group-hover:opacity-0" : undefined}
      />
      {secondaryImage && secondaryRequested && (
        <ImageOrPlaceholder
          image={secondaryImage}
          size={size}
          alt={`${alt} - alternatif görünüm`}
          onLoad={() => setSecondaryReady(true)}
          className={clx(
            "opacity-0 transition-all duration-300 group-hover:scale-[1.02]",
            secondaryReady && "group-hover:opacity-100"
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
