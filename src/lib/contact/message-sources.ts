import "server-only"
import { query } from "@lib/admin/db"
import { ensureQuestionConversations } from "./question-conversations"

// Existing records keep their conversation and delivery history. Never resend mail.
export async function ensureMessageSources() {
  await ensureQuestionConversations()
  await query(`UPDATE contact_messages SET source_kind='gifts'
    WHERE subject='Kurumsal hediye talebi' AND source_kind='contact'
      AND product_question_id IS NULL AND product_review_id IS NULL`)
  await query(`INSERT INTO contact_messages
    (product_review_id,source_kind,name,email,subject,message,customer_id,status,created_at)
    SELECT r.id,'reviews',r.author,r.email,COALESCE(p.title,'Ürün yorumu'),r.comment,r.customer_id,
      CASE WHEN r.status='pending' THEN 'new' ELSE 'read' END,r.created_at
    FROM product_reviews r LEFT JOIN store_product p ON p.id=r.product_id
    WHERE COALESCE(r.type,'review')='review'
      AND NOT EXISTS (SELECT 1 FROM contact_messages m WHERE m.product_review_id=r.id)
    ON CONFLICT (product_review_id) WHERE product_review_id IS NOT NULL DO NOTHING`)
}

export const messageSourceSql = `CASE
  WHEN m.product_question_id IS NOT NULL THEN 'questions'
  WHEN m.product_review_id IS NOT NULL THEN 'reviews'
  WHEN m.source_kind='gifts' THEN 'gifts'
  ELSE 'contact' END`
