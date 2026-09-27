import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { ensureMediaTrashSchema } from "@lib/commerce/media-trash"
import { slugify } from "@lib/commerce/repository"
import { deleteMedia, renameMedia } from "@lib/storage/media-storage"
import path from "path"

type MediaRow = {
  id: string
  url: string
  filename: string
  storage_key: string | null
  mime_type: string | null
  size_bytes: number | null
  title: string | null
  alt_text: string | null
  caption: string | null
  description: string | null
  created_at: string | null
  updated_at: string | null
  database_backed: boolean
}

const validIdentifier = (value: string) => /^[a-z_][a-z0-9_]*$/i.test(value)

async function replaceMediaUrlReferences(
  client: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  oldUrl: string,
  newUrl: string,
) {
  if (oldUrl === newUrl) return
  const columns = await client.query(
    `SELECT table_name,column_name,data_type
     FROM information_schema.columns
     WHERE table_schema='public'
       AND table_name <> 'store_media'
       AND data_type IN ('text','character varying','json','jsonb')`,
  ) as { rows?: Array<{ table_name: string; column_name: string; data_type: string }> }

  for (const column of columns.rows || []) {
    if (!validIdentifier(column.table_name) || !validIdentifier(column.column_name)) continue
    const table = `"${column.table_name}"`
    const field = `"${column.column_name}"`
    if (column.data_type === "jsonb") {
      await client.query(
        `UPDATE ${table} SET ${field}=REPLACE(${field}::text,$1,$2)::jsonb
         WHERE ${field}::text LIKE '%' || $1 || '%'`,
        [oldUrl, newUrl],
      )
    } else if (column.data_type === "json") {
      await client.query(
        `UPDATE ${table} SET ${field}=REPLACE(${field}::text,$1,$2)::json
         WHERE ${field}::text LIKE '%' || $1 || '%'`,
        [oldUrl, newUrl],
      )
    } else {
      await client.query(
        `UPDATE ${table} SET ${field}=REPLACE(${field},$1,$2)
         WHERE ${field} LIKE '%' || $1 || '%'`,
        [oldUrl, newUrl],
      )
    }
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  await ensureCommerceSchema()
  await ensureMediaTrashSchema()
  const id = (await params).id
  const body = await req.json()
  const rows = await query<MediaRow>(
    `SELECT id,url,filename,storage_key,mime_type,size_bytes,title,alt_text,
            caption,description,created_at,updated_at,
            (data_bytes IS NOT NULL OR data_base64 IS NOT NULL) AS database_backed
     FROM store_media WHERE id=$1`,
    [id],
  )
  const media = rows[0]
  if (!media) return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 404 })

  for (const field of ["filename", "title", "alt_text", "caption", "description"]) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      return NextResponse.json({ error: "Geçersiz medya bilgisi." }, { status: 400 })
    }
  }

  const currentExtension = path.extname(media.filename || media.storage_key || "")
  const requestedBase = slugify(String(body.filename || "").replace(/\.[^.]+$/, ""))
  const requestedFilename = requestedBase
    ? `${requestedBase}${currentExtension.toLowerCase()}`
    : media.filename
  const shouldRename = Boolean(requestedFilename && requestedFilename !== media.filename)

  if (shouldRename) {
    const duplicate = await query<{ id: string }>(
      `SELECT id FROM store_media WHERE filename=$1 AND id<>$2 LIMIT 1`,
      [requestedFilename, id],
    )
    if (duplicate.length) {
      return NextResponse.json(
        { error: "Bu dosya adı medya kütüphanesinde zaten kullanılıyor." },
        { status: 409 },
      )
    }
  }

  let renamed: { url: string; storageKey: string } | null = null
  try {
    if (shouldRename && requestedFilename) {
      renamed = media.database_backed
        ? {
            url: `/uploads/${encodeURIComponent(requestedFilename)}`,
            storageKey: requestedFilename,
          }
        : await renameMedia(
            media.storage_key || media.filename,
            requestedFilename,
            media.mime_type || "application/octet-stream",
          )
    }
    const nextUrl = renamed?.url || media.url
    const nextStorageKey = renamed?.storageKey || media.storage_key || media.filename

    const updated = await withTransaction(async (client) => {
      await replaceMediaUrlReferences(client, media.url, nextUrl)
      const result = await client.query<MediaRow>(
        `UPDATE store_media SET
           url=$2,filename=$3,storage_key=$4,title=$5,alt_text=$6,
           caption=$7,description=$8,updated_at=NOW()
         WHERE id=$1 RETURNING *`,
        [
          id,
          nextUrl,
          requestedFilename || media.filename,
          nextStorageKey,
          String(body.title ?? media.title ?? "").trim() || null,
          String(body.alt_text ?? media.alt_text ?? "").trim() || null,
          String(body.caption ?? media.caption ?? "").trim() || null,
          String(body.description ?? media.description ?? "").trim() || null,
        ],
      )
      return result.rows[0]
    })

    return NextResponse.json({ file: updated, references_updated: media.url !== nextUrl })
  } catch (error: any) {
    if (renamed && !media.database_backed) {
      await renameMedia(
        renamed.storageKey,
        path.basename(media.storage_key || media.filename),
        media.mime_type || "application/octet-stream",
      ).catch(() => undefined)
    }
    return NextResponse.json(
      { error: error?.message || "Görsel bilgileri güncellenemedi." },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  await ensureMediaTrashSchema()
  const id = (await params).id
  const permanent = new URL(req.url).searchParams.get("permanent") === "true"
  if (!permanent) {
    const rows = await query<{ id: string }>(
      `UPDATE store_media SET deleted_at=NOW(),updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL RETURNING id`,
      [id],
    )
    return NextResponse.json({ success: Boolean(rows[0]), permanent: false })
  }
  const rows = await query<{ filename: string; storage_key: string | null }>(
    `DELETE FROM store_media WHERE id=$1 AND deleted_at IS NOT NULL RETURNING filename,storage_key`,
    [id]
  )
  const storageKey = rows[0]?.storage_key || rows[0]?.filename
  if (storageKey) await deleteMedia(storageKey)
  return NextResponse.json({ success: Boolean(rows[0]), permanent: true })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  await ensureMediaTrashSchema()
  const body = await req.json().catch(() => ({}))
  if (body.action !== "restore") {
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 })
  }
  const id = (await params).id
  const rows = await query<{ id: string }>(
    `UPDATE store_media SET deleted_at=NULL,updated_at=NOW()
     WHERE id=$1 AND deleted_at IS NOT NULL RETURNING id`,
    [id],
  )
  return NextResponse.json({ success: Boolean(rows[0]) })
}
