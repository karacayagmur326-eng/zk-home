import { NextResponse } from "next/server"
import { cachedQuery } from "@lib/admin/db"

const fallbackSection = {
  title: "ÖNE ÇIKAN ÜRÜNLER",
  subtitle: "Atölyeniz için en güçlü seçimler.",
}

export const revalidate = 300

export async function GET() {
  const [sections, tabs] = await Promise.all([
    cachedQuery<{ title: string; subtitle: string }>(
      "public-featured-section",
      "SELECT title, subtitle FROM featured_section WHERE id = 'main'",
      [],
      300
    ).catch(() => []),
    cachedQuery<{
      id: string
      label: string
      tag_id: string
      position: number
      is_active: boolean
    }>(
      "public-featured-tabs",
      `SELECT id, label, tag_id, position, is_active
       FROM featured_tabs
       WHERE is_active = TRUE
       ORDER BY position ASC`,
      [],
      300
    ).catch(() => []),
  ])

  return NextResponse.json(
    { section: sections[0] || fallbackSection, tabs },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  )
}
