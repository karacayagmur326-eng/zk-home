import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId } from "@lib/commerce/repository"
import * as path from "path"
import sharp from "sharp"
import {
  deleteMedia,
  storeMedia,
  readDirectMediaUpload,
} from "@lib/storage/media-storage"

const MAX_FILE_SIZE = 8 * 1024 * 1024
const MAX_REQUEST_SIZE = 32 * 1024 * 1024

function mediaTitle(filename: string) {
  return path.basename(filename, path.extname(filename)).replace(/[-_]+/g, " ")
}

function detectImageExtension(bytes: Buffer) {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  )
    return ".png"
  if (
    bytes.length >= 3 &&
    bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  )
    return ".jpg"
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return ".webp"
  if (
    bytes.length >= 12 &&
    bytes.subarray(4, 8).toString("ascii") === "ftyp" &&
    ["avif", "avis"].includes(bytes.subarray(8, 12).toString("ascii"))
  )
    return ".avif"
  return null
}

function mimeForExtension(extension: string) {
  return extension === ".jpg" ? "image/jpeg" : `image/${extension.slice(1)}`
}

function safeFilename(originalName: string, extension: string) {
  const leafName = originalName.replace(/\\/g, "/").split("/").pop() || ""
  const baseName = path.basename(leafName, path.extname(leafName))
  // Keep the descriptive name, case and separators; normalize only characters
  // that cannot be used safely across our storage providers.
  const cleanBase = baseName
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._ -]+/g, "-")
    .replace(/^[.\s-]+|[.\s-]+$/g, "")
    .slice(0, 160) || "gorsel"
  return `${cleanBase}${extension}`
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  let pendingKey: string | undefined
  try {
    await ensureCommerceSchema()
    let values: FormDataEntryValue[]
    if (req.headers.get("content-type")?.includes("application/json")) {
      const input = await req.json()
      if (typeof input.key !== "string" || !/^pending\/[0-9a-f-]{36}$/.test(input.key) || typeof input.filename !== "string") {
        return NextResponse.json({ error: "Geçersiz yükleme bilgisi." }, { status: 400 })
      }
      pendingKey = input.key
      const bytes = await readDirectMediaUpload(input.key)
      values = [new File([new Uint8Array(bytes)], input.filename)]
    } else {
      const formData = await req.formData()
      values = Array.from(formData.values())
    }
    const files = []
    let requestSize = 0

    for (const value of values) {
      if (!(value instanceof File) || value.size === 0) continue
      requestSize += value.size
      if (value.size > MAX_FILE_SIZE || requestSize > MAX_REQUEST_SIZE) {
        return NextResponse.json(
          { error: "Dosya boyutu sınırı aşıldı. Dosya başına 8 MB izin verilir." },
          { status: 413 }
        )
      }
      let bytes: Buffer = Buffer.from(await value.arrayBuffer())
      let detectedExtension = detectImageExtension(bytes)
      if (!detectedExtension) {
        return NextResponse.json(
          {
            error:
              "Yalnızca doğrulanmış PNG, JPEG, WebP ve AVIF görseller yüklenebilir.",
          },
          { status: 415 }
        )
      }
      // Lossless encoding preserves decoded pixels, dimensions and transparency.
      // Animated images remain untouched to preserve every frame.
      const image = sharp(bytes, { limitInputPixels: 40_000_000 })
      const metadata = await image.metadata()
      if ((metadata.pages || 1) === 1) {
        const optimized = await image.keepMetadata().webp({ lossless: true, effort: 4 }).toBuffer()
        if (optimized.length < bytes.length) {
          bytes = optimized
          detectedExtension = ".webp"
        }
      }
      const requested = safeFilename(value.name, detectedExtension)
      const id = createId("media")
      const mimeType = mimeForExtension(detectedExtension)
      const stored = await storeMedia({
        filename: requested,
        bytes,
        contentType: mimeType,
      })

      const nowIso = new Date().toISOString()
      try {
        await query(
          `INSERT INTO store_media
           (id,url,filename,storage_key,mime_type,size_bytes,data_bytes,title,alt_text,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
          [
            id,
            stored.url,
            path.basename(stored.storageKey),
            stored.storageKey,
            mimeType,
            bytes.length,
            stored.databaseBytes || null,
            mediaTitle(requested),
            null,
            nowIso,
          ]
        )
      } catch (dbErr) {
        await deleteMedia(stored.storageKey).catch(() => undefined)
        throw dbErr
      }

      files.push({
        id,
        url: stored.url,
        filename: path.basename(stored.storageKey),
        storage_key: stored.storageKey,
        mime_type: mimeType,
        size: bytes.length,
        created_at: nowIso,
      })
    }

    if (!files.length)
      return NextResponse.json(
        { error: "Yüklenecek dosya bulunamadı." },
        { status: 400 }
      )
    return NextResponse.json({ files }, { status: 201 })
  } catch (error: any) {
    console.error("Upload route error:", error)
    return NextResponse.json(
      { error: "Dosya yüklenemedi. Medya deposu yapılandırmasını kontrol edin." },
      { status: 500 },
    )
  } finally {
    if (pendingKey) await deleteMedia(pendingKey).catch(() => undefined)
  }
}
