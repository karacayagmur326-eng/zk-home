import { NextResponse } from "next/server"
import { getContactCustomer } from "@lib/contact/customer-messages"
import { customerNotifications, readCustomerNotifications } from "@lib/notifications/customer"

const headers = { "Cache-Control": "private, no-store" }

export async function GET() {
  try {
    const customer = await getContactCustomer()
    if (!customer) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers })
    return NextResponse.json(await customerNotifications(customer), { headers })
  } catch {
    return NextResponse.json({ error: "Bildirimler yüklenemedi." }, { status: 500, headers })
  }
}

export async function POST(request: Request) {
  try {
    const customer = await getContactCustomer()
    if (!customer) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers })
    const body = await request.json().catch(() => null)
    if (!body || (body.all !== true && (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 50 || body.ids.some((id: unknown) => typeof id !== "string" || id.length > 300)))) {
      return NextResponse.json({ error: "Geçersiz bildirim." }, { status: 400, headers })
    }
    await readCustomerNotifications(customer, body.all === true ? null : body.ids)
    return NextResponse.json(await customerNotifications(customer), { headers })
  } catch {
    return NextResponse.json({ error: "Bildirim güncellenemedi." }, { status: 500, headers })
  }
}
