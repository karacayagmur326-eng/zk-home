import { processNotificationOutbox } from "@lib/notifications/outbox"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  return NextResponse.json(await processNotificationOutbox(25))
}
