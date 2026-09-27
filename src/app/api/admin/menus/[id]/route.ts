import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  const { id } = await params
  try {
    // 1. Delete menu items
    await query(`DELETE FROM navigation_menu_item WHERE menu_id = $1`, [id])
    
    // 2. Delete menu
    await query(`DELETE FROM navigation_menu WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
