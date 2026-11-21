import catalog from "./prepared-images.json"

type PreparedImage = { id: string; widths: number[] }
const images = catalog as Record<string, PreparedImage>
const byId = new Map(Object.values(images).map(image => [image.id, image]))
const storageHost = "pgdxrqjmthdusrqozyzu.supabase.co"
const storagePrefix = "/storage/v1/object/public/store-media/uploads/"

/** Only the public images verified against the live catalog have local copies. */
export function preparedImage(source: unknown): PreparedImage | undefined {
  if (typeof source !== "string") return undefined
  const local = source.match(/^\/catalog-media\/([a-f0-9]+)-\d+\.webp(?:\?.*)?$/)
  if (local) return byId.get(local[1])
  try {
    const url = new URL(source, "https://zk-home.com")
    const prefix = url.hostname === storageHost ? storagePrefix
      : ["zk-home.com", "www.zk-home.com"].includes(url.hostname) ? "/uploads/" : ""
    if (!prefix || !url.pathname.startsWith(prefix)) return undefined
    const filename = decodeURIComponent(url.pathname.slice(prefix.length))
    return Object.prototype.hasOwnProperty.call(images, filename) ? images[filename] : undefined
  } catch { return undefined }
}

export function preparedImagePath(image: PreparedImage, width?: number) {
  const size = image.widths.find(size => size >= (width || Infinity)) || image.widths[image.widths.length - 1]
  return `/catalog-media/${image.id}-${size}.webp`
}

export function preparedImageSource(source: string) {
  const image = preparedImage(source)
  return image ? preparedImagePath(image) : source
}
