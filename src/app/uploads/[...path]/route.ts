import { NextRequest, NextResponse } from "next/server"
import { query } from "@lib/admin/db"
import * as fs from "fs"
import * as path from "path"

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params
  const pathSegments = params.path
  if (!pathSegments || pathSegments.length === 0) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const rawFilename = pathSegments[pathSegments.length - 1]
  const cleanFilename = decodeURIComponent(rawFilename).split("?")[0]

  // 1. Try reading physical file from disk first (Localhost or committed files)
  try {
    const uploadRoot = path.resolve(process.cwd(), "public", "uploads")
    const localFilePath = path.resolve(uploadRoot, ...pathSegments)
    if (
      localFilePath.startsWith(`${uploadRoot}${path.sep}`) &&
      fs.existsSync(localFilePath) &&
      fs.statSync(localFilePath).isFile()
    ) {
      const fileBuffer = fs.readFileSync(localFilePath)
      const ext = path.extname(cleanFilename).toLowerCase()
      const mimeType =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
          ? "image/webp"
          : ext === ".svg"
          ? "image/svg+xml"
          : "application/octet-stream"

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }
  } catch (err) {
    // Proceed to DB fallback
  }

  // 2. Database fallback (Supabase Storage URL or legacy PostgreSQL payload)
  try {
    const rows = await query<{ url?: string; data_bytes?: Buffer; data_base64?: string; mime_type?: string; filename?: string }>(
      `SELECT url, data_bytes, data_base64, mime_type, filename FROM store_media
       WHERE (filename = $1 OR storage_key = $1 OR url = $2)
         AND deleted_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      [cleanFilename, `/uploads/${encodeURIComponent(cleanFilename)}`]
    )

    if (rows.length > 0) {
      const row = rows[0]
      if (row.url?.startsWith("https://")) {
        const storedImage = await fetch(row.url, { cache: "force-cache" })
        if (!storedImage.ok) {
          return new NextResponse("Görsel bulunamadı", { status: 404 })
        }

        return new NextResponse(await storedImage.arrayBuffer(), {
          status: 200,
          headers: {
            "Content-Type":
              storedImage.headers.get("content-type") ||
              row.mime_type ||
              "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      }

      const rawBase64 = row.data_base64 || ""
      const base64Content = rawBase64.includes(",")
        ? rawBase64.split(",")[1]
        : rawBase64
      const imageBuffer = row.data_bytes
        ? Buffer.from(row.data_bytes)
        : base64Content
          ? Buffer.from(base64Content, "base64")
          : null
      if (!imageBuffer) {
        return new NextResponse("Görsel bulunamadı", { status: 404 })
      }
      const mimeType = row.mime_type || "image/png"

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }
  } catch (dbErr) {
    console.error("Uploads route DB fallback error:", dbErr)
  }

  return new NextResponse("Görsel bulunamadı", { status: 404 })
}
