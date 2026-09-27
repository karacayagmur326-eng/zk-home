import "server-only"

import { randomUUID } from "crypto"
import path from "path"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId, slugify } from "@lib/commerce/repository"
import { deleteMedia, storeMedia } from "@lib/storage/media-storage"

const MAX_FILE_SIZE = 8 * 1024 * 1024
const INLINE_IMAGE = /^data:(image\/(?:png|jpeg|webp|avif));base64,([a-z0-9+/=\r\n]+)$/i

const extensionForMime: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/avif": ".avif",
}

type LegacyMediaRow = {
  id: string
  url: string
  filename: string | null
  storage_key: string | null
  mime_type: string | null
  data_bytes: Buffer | null
  data_base64: string | null
}

function matchesImageSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/png") {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  }
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
  }
  return bytes.length >= 12 &&
    bytes.subarray(4, 8).toString("ascii") === "ftyp" &&
    ["avif", "avis"].includes(bytes.subarray(8, 12).toString("ascii"))
}

async function persistImageBytes(
  bytes: Buffer,
  mimeType: string,
  label: string,
  existing?: LegacyMediaRow,
) {
  if (!bytes.length || bytes.length > MAX_FILE_SIZE) {
    throw new Error("Görsel boyutu geçersiz veya 8 MB sınırını aşıyor.")
  }
  if (!matchesImageSignature(bytes, mimeType)) {
    throw new Error("Görsel içeriği dosya türüyle eşleşmiyor.")
  }

  await ensureCommerceSchema()
  const extension = extensionForMime[mimeType]
  const base = slugify(label) || "gorsel"
  const requested = `${base}-${randomUUID()}${extension}`
  const stored = await storeMedia({ filename: requested, bytes, contentType: mimeType })
  const now = new Date().toISOString()
  const id = existing?.id || createId("media")

  try {
    if (existing) {
      await query(
        `UPDATE store_media SET
           url=$2,filename=$3,storage_key=$4,mime_type=$5,size_bytes=$6,
           data_bytes=$7,data_base64=NULL,updated_at=$8,deleted_at=NULL
         WHERE id=$1`,
        [
          id,
          stored.url,
          path.basename(stored.storageKey),
          stored.storageKey,
          mimeType,
          bytes.length,
          stored.databaseBytes || null,
          now,
        ],
      )
    } else {
      await query(
        `INSERT INTO store_media
         (id,url,filename,storage_key,mime_type,size_bytes,data_bytes,title,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
        [
          id,
          stored.url,
          path.basename(stored.storageKey),
          stored.storageKey,
          mimeType,
          bytes.length,
          stored.databaseBytes || null,
          label,
          now,
        ],
      )
    }
  } catch (error) {
    await deleteMedia(stored.storageKey).catch(() => undefined)
    throw error
  }

  return stored.url
}

function decodeStoredMedia(row: LegacyMediaRow) {
  if (row.data_bytes?.length) return Buffer.from(row.data_bytes)
  const raw = row.data_base64 || ""
  const encoded = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw
  return encoded ? Buffer.from(encoded.replace(/\s/g, ""), "base64") : null
}

export async function persistInlineImageUrl(value: unknown, label = "gorsel") {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  if (trimmed.startsWith("/") || /^https:\/\//i.test(trimmed)) return trimmed

  await ensureCommerceSchema()

  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(INLINE_IMAGE)
    if (!match) throw new Error("Yalnızca PNG, JPEG, WebP ve AVIF görseller kaydedilebilir.")

    const mimeType = match[1].toLowerCase()
    const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64")
    const existing = (await query<LegacyMediaRow>(
      `SELECT id,url,filename,storage_key,mime_type,data_bytes,data_base64
       FROM store_media WHERE url=$1 ORDER BY deleted_at NULLS FIRST,created_at DESC NULLS LAST LIMIT 1`,
      [trimmed],
    ))[0]
    return persistImageBytes(bytes, mimeType, label, existing)
  }

  // Eski medya kütüphanesi sürümleri bazı seçimlerde URL yerine dosya anahtarını
  // forma yazabiliyordu. İçerik DB'de mevcutsa kaydı kaybetmeden kanonikleştir.
  const legacy = (await query<LegacyMediaRow>(
    `SELECT id,url,filename,storage_key,mime_type,data_bytes,data_base64
     FROM store_media
     WHERE deleted_at IS NULL AND (url=$1 OR filename=$1 OR storage_key=$1)
     ORDER BY created_at DESC NULLS LAST LIMIT 1`,
    [trimmed],
  ))[0]
  const bytes = legacy ? decodeStoredMedia(legacy) : null
  const mimeType = legacy?.mime_type?.toLowerCase() || ""
  if (legacy && bytes && extensionForMime[mimeType]) {
    return persistImageBytes(bytes, mimeType, label, legacy)
  }

  return trimmed
}
