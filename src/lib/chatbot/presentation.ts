export function formatChatbotAnswer(value: unknown) {
  const answer = String(value || "").replace(/\r\n/g, "\n").trim()
  if (!answer || /\*\*[^*]+\*\*/.test(answer)) return answer

  const paragraphs = answer.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)
  if (paragraphs.length > 1) {
    return [`**${paragraphs[0]}**`, ...paragraphs.slice(1)].join("\n\n")
  }

  // Sentence boundaries require whitespace so dots inside e-mail addresses,
  // domains, prices and model numbers are never split into separate blocks.
  const sentences = answer.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean)
  if (sentences.length <= 1) return `**${answer}**`
  return `**${sentences[0]}**\n\n${sentences.slice(1).join(" ")}`
}
