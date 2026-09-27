import { getAdminSession } from "@lib/admin/auth"
import { processNotificationOutbox } from "@lib/notifications/outbox"
import { NextResponse } from "next/server"

export async function POST() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  return NextResponse.json(await processNotificationOutbox(25))
}
