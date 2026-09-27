import NextImage, { type ImageProps } from "next/image"

export default function SmartImage(props: ImageProps) {
  // Local uploads also need responsive sizing and modern image formats.
  // Explicit opt-outs (for example animated assets) still pass through.
  return <NextImage {...props} />
}
