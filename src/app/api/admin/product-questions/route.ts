import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureQuestionConversations } from "@lib/contact/question-conversations"
import { GET as getMessages, PATCH as replyToMessage } from "../contact-messages/route"

export const maxDuration = 60

// Compatibility for older open admin tabs; all replies use the contact workflow.
export async function GET() {
  const response = await getMessages(new Request("http://localhost/api/admin/contact-messages?kind=questions"))
  if (!response.ok) return response
  const data = await response.json()
  return NextResponse.json({questions:data.messages.map((m: Record<string, unknown>)=>({...m,id:String(m.product_question_id),author:m.name,comment:m.message,answer:m.admin_reply}))},{headers:{"Cache-Control":"private, no-store"}})
}
export async function PATCH(request: Request) {
  if (!await getAdminSession(["Admin","Yönetici"])) return NextResponse.json({error:"Yetkisiz erişim."},{status:401})
  try {
    const body = await request.json()
    if (!/^\d{1,18}$/.test(String(body.id || ""))) return NextResponse.json({error:"Soru bulunamadı."},{status:404})
    await ensureQuestionConversations()
    const [thread] = await query<{id:string}>("SELECT id::text FROM contact_messages WHERE product_question_id=$1",[body.id])
    if (!thread) return NextResponse.json({error:"Soru bulunamadı."},{status:404})
    return replyToMessage(new Request(request.url,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:thread.id,reply:body.answer,publish_answer:true})}))
  } catch { return NextResponse.json({error:"Yanıt kaydedilemedi."},{status:500}) }
}
