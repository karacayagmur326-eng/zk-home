import { NextResponse } from "next/server"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getContactCustomer, listCustomerMessages, getCustomerMessage, replyToCustomerMessage } from "@lib/contact/customer-messages"
import { checkRateLimit } from "@lib/security/rate-limit"

const headers = { "Cache-Control": "private, no-store" }
const validId = (id: string) => /^\d{1,18}$/.test(id)

export async function GET(request: Request) {
  try {
    const customer = await getContactCustomer()
    if (!customer) return NextResponse.json({ error: "Mesajlarınızı görmek için giriş yapın." }, { status: 401, headers })
    await ensureCommerceSchema()
    const id = new URL(request.url).searchParams.get("id")
    if (id !== null) {
      if (!validId(id)) return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404, headers })
      const message = await getCustomerMessage(customer,id)
      return message ? NextResponse.json({ message }, { headers }) : NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404, headers })
    }
    return NextResponse.json({ messages: await listCustomerMessages(customer,new URL(request.url).searchParams.get("kind") === "questions" ? "questions" : "messages") }, { headers })
  } catch {
    return NextResponse.json({ error: "Mesajlar yüklenemedi. Lütfen tekrar deneyin." }, { status: 500, headers })
  }
}

export async function POST(request: Request) {
  try {
    const customer = await getContactCustomer()
    if (!customer) return NextResponse.json({ error: "Mesaj göndermek için giriş yapın." }, { status: 401, headers })
    const body = await request.json()
    const id = String(body.id || "")
    const message = typeof body.message === "string" ? body.message.trim() : ""
    if (!validId(id) || message.length < 3 || message.length > 5000) {
      return NextResponse.json({ error: "Mesajınız 3 ile 5.000 karakter arasında olmalıdır." }, { status: 400, headers })
    }
    const rate = await checkRateLimit(`contact-account:${customer.id}`, 20, 600)
    if (!rate.allowed) return NextResponse.json({ error: "Çok fazla mesaj gönderdiniz. Lütfen daha sonra tekrar deneyin." }, { status: 429, headers })
    await ensureCommerceSchema()
    if (!await replyToCustomerMessage(customer,id,message)) return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404, headers })
    return NextResponse.json({ ok: true, message: await getCustomerMessage(customer,id) }, { status: 201, headers })
  } catch {
    return NextResponse.json({ error: "Mesaj gönderilemedi. Lütfen tekrar deneyin." }, { status: 500, headers })
  }
}
