import { NextResponse } from "next/server"
import { findChatbotAnswer, findSitePageGuide, getChatbotSettings, getConversationalReply } from "@lib/chatbot/settings"
import { analyzeCatalogQuestion } from "@lib/chatbot/catalog"
import { generateAiChatbotAnswer } from "@lib/chatbot/ai"
import { analyzeBusinessQuestion } from "@lib/chatbot/business"
import { searchPublicSiteKnowledge } from "@lib/chatbot/knowledge"
import { understandQuery } from "@lib/chatbot/understanding"
import { formatChatbotAnswer } from "@lib/chatbot/presentation"
import { resolveCatalogTaxonomy } from "@lib/chatbot/taxonomy"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(
      `chatbot:${requestIp(request)}`,
      30,
      60
    )
    if (!rate.allowed) {
      return NextResponse.json({ error: "Çok hızlı mesaj gönderdiniz. Lütfen kısa bir süre bekleyin." }, { status: 429 })
    }
    const body = await request.json()
    const message = String(body?.message || "").trim().slice(0, 500)
    const unansweredCount = Math.min(Math.max(Number(body?.unanswered_count || 0), 0), 10)
    const history = (Array.isArray(body?.history) ? body.history : [])
      .slice(-6)
      .map((item: any) => ({
        role: item?.role === "bot" ? "bot" as const : "user" as const,
        text: String(item?.text || "").trim().slice(0, 500),
      }))
      .filter((item: { text: string }) => item.text)
    if (!message) {
      return NextResponse.json({ error: "Lütfen bir soru yazın." }, { status: 400 })
    }

    const settings = await getChatbotSettings()
    if (!settings.enabled) {
      return NextResponse.json({ error: "Asistan şu anda kullanılamıyor." }, { status: 503 })
    }

    const conversationalReply = getConversationalReply(message)
    const catalogHint = conversationalReply ? null : await resolveCatalogTaxonomy(message)
    const understanding = understandQuery(message, history, catalogHint)
    const retrievalAllowed = understanding.needsRetrieval && !conversationalReply
    // These are explicit, administrator-controlled site page routes. They are safe
    // to resolve even when the general intent classifier considers a short query unclear.
    const pageGuideMatch = !conversationalReply ? findSitePageGuide(settings, message) : null
    const pageGuideResult = pageGuideMatch ? {
      answer: pageGuideMatch.answer,
      link_url: pageGuideMatch.link_url || "",
      link_text: pageGuideMatch.link_text || "Sayfayı İncele",
      source: "site_page_guide" as const,
      evidence: [pageGuideMatch.answer],
    } : null
    const businessResult = retrievalAllowed && !pageGuideResult && understanding.intent === "CONTACT_INFORMATION"
      ? await analyzeBusinessQuestion(message, history)
      : null
    const preparedMatch = retrievalAllowed && !pageGuideResult && !businessResult && ["WARRANTY_QUERY", "RETURN_QUERY", "SHIPPING_QUERY", "SITE_GUIDANCE", "FAQ_INFORMATION"].includes(understanding.intent)
      ? findChatbotAnswer(settings, message)
      : null
    const preparedResult = preparedMatch ? {
      answer: preparedMatch.answer,
      link_url: preparedMatch.link_url || "",
      link_text: preparedMatch.link_text || "",
      source: "prepared_answer" as const,
      evidence: [preparedMatch.answer],
    } : null
    const catalogResult = !retrievalAllowed || pageGuideResult || businessResult || preparedResult ? null : await analyzeCatalogQuestion(message, settings, understanding, understanding.catalogHint)
    const pageResult = !retrievalAllowed || catalogResult || pageGuideResult || businessResult || preparedResult ? null : await searchPublicSiteKnowledge(message, settings, understanding)
    const unresolvedWithoutRetrieval = !understanding.needsRetrieval && understanding.intent === "UNCLEAR_INTENT"
    const base = pageGuideResult || businessResult || preparedResult || catalogResult || pageResult || (conversationalReply ? {
      answer: conversationalReply,
      link_url: "",
      link_text: "",
      source: "conversation" as const,
    } : null) || (!understanding.needsRetrieval && !unresolvedWithoutRetrieval ? {
        answer: understanding.intent === "GIBBERISH"
          ? "Mesajınızı tam anlayamadım. Ürün, sipariş, kargo veya garantiyle ilgili sorunuzu biraz daha açık yazabilir misiniz?"
          : "ZK Home ürünleriyle ilgili nasıl yardımcı olabilirim?",
        link_url: "",
        link_text: "",
        source: "retrieval_abstention" as const,
      } : {
        answer: unresolvedWithoutRetrieval || !understanding.needsClarification
          ? unansweredCount > 0
            ? "Aradığınız bilgiye yine doğrulanmış bir yanıt bulamadım; sizi yanlış yönlendirmek istemem. WhatsApp veya iletişim formundan ekibimize ulaşırsanız hemen yardımcı olalım."
            : settings.fallback_message
          : understanding.needsClarification
          ? "Hangi ürün veya ürün grubunu kastettiğinizi ve ne işte kullanacağınızı yazarsanız sitedeki gerçek bilgilerden net cevap verebilirim."
          : settings.fallback_message,
        link_url: "",
        link_text: "",
        source: "fallback" as const,
      })
    const products = "products" in base && Array.isArray(base.products) ? base.products : []
    const evidence = "evidence" in base && Array.isArray(base.evidence) ? base.evidence : []
    const grounding = [
      `Sorgu anlayışı: ${JSON.stringify({ intent: understanding.intent, secondaryIntent: understanding.secondaryIntent, entities: understanding.entities, useCase: understanding.useCase, aspect: understanding.aspect })}`,
      `Doğrulanmış temel yanıt: ${base.answer}`,
      evidence.length ? `Kanıtlar:\n${evidence.slice(0, 6).map((item) => typeof item === "string" ? item : JSON.stringify(item)).join("\n")}` : "",
      products.length ? `Canlı ürünler:\n${products.slice(0, 4).map((item) => {
        const facts = Array.isArray(item.facts) ? item.facts.slice(0, 8).join("; ") : ""
        return `${item.title} — ${item.price} — ${item.available ? "stokta" : "stok durumu belirsiz"}${facts ? ` — ${facts}` : ""}`
      }).join("\n")}` : "",
    ].filter(Boolean).join("\n\n")
    const ai = ["site_page_guide", "business_info", "prepared_answer", "conversation", "retrieval_abstention", "fallback", "catalog_clarification"].includes(base.source) ? null : await generateAiChatbotAnswer({
      message,
      history,
      settings,
      grounding,
    })
    const needsHuman = ai ? ai.needs_human : base.source === "fallback"
    return NextResponse.json({
      matched: !needsHuman,
      needs_human: needsHuman,
      ...base,
      answer: formatChatbotAnswer(ai?.answer || base.answer),
      source: ai ? `ai_${base.source}` : base.source,
    })
  } catch (error) {
    console.error("[chatbot] request failed", error)
    return NextResponse.json({ error: "Yanıt oluşturulamadı." }, { status: 500 })
  }
}
