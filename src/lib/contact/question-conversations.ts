import "server-only"
import { query } from "@lib/admin/db"
import { ensureProductQuestions } from "@lib/commerce/product-questions"
import { ensureContactHistory } from "@lib/email/contact-history"

/** Product questions use the same contact thread, history and email outbox. */
let ready: Promise<void> | null = null
export function ensureQuestionConversations(): Promise<void> {
  if (!ready) ready = initializeQuestionConversations().catch(error => { ready = null; throw error })
  return ready
}

async function initializeQuestionConversations() {
  await ensureProductQuestions()
  await ensureContactHistory()
  await query(`INSERT INTO contact_messages
    (product_question_id,name,email,subject,message,customer_id,status,created_at,admin_reply,replied_at)
    SELECT r.id,r.author,r.email,COALESCE(p.title,'Ürün sorusu'),r.comment,r.customer_id,
      CASE WHEN NULLIF(BTRIM(r.answer),'') IS NOT NULL THEN 'replied' ELSE 'new' END,
      r.created_at,NULLIF(BTRIM(r.answer),''),r.answered_at
    FROM product_reviews r LEFT JOIN store_product p ON p.id=r.product_id
    WHERE r.type='question' AND NOT EXISTS (SELECT 1 FROM contact_messages m WHERE m.product_question_id=r.id)
    ON CONFLICT (product_question_id) WHERE product_question_id IS NOT NULL DO NOTHING`)
  // Attach historical email records without re-queuing or resending them.
  await query(`UPDATE notification_outbox n SET payload=n.payload ||
      jsonb_build_object('message_id',m.id::text,'reply',n.payload->>'answer')
    FROM contact_messages m WHERE m.product_question_id IS NOT NULL
      AND n.type='product_question_answered' AND n.payload->>'message_id' IS NULL
      AND n.id LIKE 'notif_product_answer_' || m.product_question_id || '_%'
      AND split_part(n.id,'_',4)=m.product_question_id::text`)
}
