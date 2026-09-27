import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { ensureMediaTrashSchema } from "@lib/commerce/media-trash"
import { createId } from "@lib/commerce/repository"
import { deleteMedia } from "@lib/storage/media-storage"
import { promises as fs } from "fs"
import path from "path"

const IMAGE_MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
}

async function syncLocalUploads() {
  const uploadDirectory = path.join(process.cwd(), "public", "uploads")

  try {
    const entries = await fs.readdir(uploadDirectory, { withFileTypes: true })
    const existing = await query<{ filename: string; created_at: string | null }>(
      `SELECT filename,created_at FROM store_media WHERE filename IS NOT NULL`
    )
    const knownMedia = new Map(existing.map(item => [item.filename, item]))
    const missing = []
    const missingDates: Array<{ filename: string; created_at: string }> = []

    for (const entry of entries) {
      if (!entry.isFile()) continue

      const extension = path.extname(entry.name).toLowerCase()
      const mimeType = IMAGE_MIME_TYPES[extension]
      if (!mimeType) continue

      const stats = await fs.stat(path.join(uploadDirectory, entry.name))
      const createdDate = stats.birthtime && !isNaN(stats.birthtime.getTime()) ? stats.birthtime : (stats.mtime || new Date())
      if (knownMedia.has(entry.name)) {
        const current = knownMedia.get(entry.name)
        if (!current?.created_at) {
          missingDates.push({ filename: entry.name, created_at: createdDate.toISOString() })
        }
        continue
      }
      missing.push({
        id: createId("media"),
        url: `/uploads/${encodeURIComponent(entry.name)}`,
        filename: entry.name,
        mime_type: mimeType,
        size_bytes: stats.size,
        created_at: createdDate.toISOString(),
      })
    }

    if (missing.length) {
      await query(
        `INSERT INTO store_media
          (id, url, filename, storage_key, mime_type, size_bytes, title, alt_text, created_at, updated_at)
         SELECT
          item.id,
          item.url,
          item.filename,
          item.filename,
          item.mime_type,
          item.size_bytes,
          regexp_replace(regexp_replace(item.filename, '\\.[^.]+$', ''), '[-_]+', ' ', 'g'),
          NULL,
          item.created_at,
          item.created_at
         FROM jsonb_to_recordset($1::jsonb) AS item(
          id text,
          url text,
          filename text,
          mime_type text,
          size_bytes bigint,
          created_at timestamptz
         )
         WHERE NOT EXISTS (
          SELECT 1 FROM store_media media WHERE media.filename = item.filename
         )`,
        [JSON.stringify(missing)]
      )
    }
    if (missingDates.length) {
      await query(
        `UPDATE store_media media
         SET created_at=item.created_at,updated_at=COALESCE(media.updated_at,item.created_at)
         FROM jsonb_to_recordset($1::jsonb) AS item(filename text,created_at timestamptz)
         WHERE media.filename=item.filename AND media.created_at IS NULL`,
        [JSON.stringify(missingDates)],
      )
    }
  } catch (error) {
    console.error("Yerel medya dosyaları eşitlenemedi:", error)
  }
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  await ensureMediaTrashSchema()
  await syncLocalUploads()
  const trash = new URL(req.url).searchParams.get("trash") === "true"
  const files = await query(
    `SELECT id,url,filename,storage_key,mime_type,size_bytes,
            title,alt_text,caption,description,created_at,updated_at,deleted_at
     FROM store_media
     WHERE deleted_at IS ${trash ? "NOT NULL" : "NULL"}
     ORDER BY created_at DESC NULLS LAST, id DESC`
  )
  const counts = await query<{ active_count: number; deleted_count: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS active_count,
       COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS deleted_count
     FROM store_media`,
  )
  return NextResponse.json(
    { files, counts: counts[0] || { active_count: 0, deleted_count: 0 } },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  await ensureMediaTrashSchema()

  try {
    const body = await req.json()
    const { ids, permanent } = body as { ids?: string[]; permanent?: boolean }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Silinecek dosya kimliği seçilmedi." }, { status: 400 })
    }

    if (!permanent) {
      const rows = await query<{ id: string }>(
        `UPDATE store_media SET deleted_at=NOW(),updated_at=NOW()
         WHERE id = ANY($1::text[]) AND deleted_at IS NULL RETURNING id`,
        [ids],
      )
      return NextResponse.json({ success: true, count: rows.length, permanent: false })
    }

    const rows = await query<{ filename: string; storage_key: string | null }>(
      `DELETE FROM store_media
       WHERE id = ANY($1::text[]) AND deleted_at IS NOT NULL
       RETURNING filename,storage_key`,
      [ids],
    )

    for (const row of rows) {
      if (row.storage_key || row.filename) {
        await deleteMedia(row.storage_key || row.filename).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, count: rows.length, permanent: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Toplu silme hatası." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  await ensureMediaTrashSchema()

  try {
    const body = await req.json() as { ids?: string[]; action?: string }
    if (!Array.isArray(body.ids) || !body.ids.length || body.action !== "restore") {
      return NextResponse.json({ error: "Geri yüklenecek dosya seçilmedi." }, { status: 400 })
    }
    const rows = await query<{ id: string }>(
      `UPDATE store_media SET deleted_at=NULL,updated_at=NOW()
       WHERE id = ANY($1::text[]) AND deleted_at IS NOT NULL RETURNING id`,
      [body.ids],
    )
    return NextResponse.json({ success: true, count: rows.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Dosyalar geri yüklenemedi." }, { status: 500 })
  }
}
