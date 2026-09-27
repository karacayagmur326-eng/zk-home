import { NextRequest, NextResponse } from "next/server"
import { query } from "@lib/admin/db"
import { getAdminSession } from "@lib/admin/auth"
import { defaultBlogPageContent } from "@lib/content/knowledge-pages"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }
  try {
    const rows = await query<{ content: Record<string, any> }>(
      "SELECT content FROM content_pages WHERE handle = 'blog' LIMIT 1"
    )
    const content = {
      ...defaultBlogPageContent,
      ...(rows[0]?.content || {}),
    }
    return NextResponse.json({ settings: content })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const currentRows = await query<{ content: Record<string, any> }>(
      "SELECT content FROM content_pages WHERE handle = 'blog' LIMIT 1"
    )
    const existingContent = currentRows[0]?.content || defaultBlogPageContent
    const mergedContent = { ...existingContent, ...body }

    await query(
      `
      INSERT INTO content_pages (handle, title, content, updated_at)
      VALUES ('blog', $1, $2, NOW())
      ON CONFLICT (handle) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        updated_at = NOW()
    `,
      [mergedContent.title || "Ürün Rehberi ve Makaleler", JSON.stringify(mergedContent)]
    )

    return NextResponse.json({ success: true, settings: mergedContent })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
