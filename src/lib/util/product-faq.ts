/** Read older FAQ sections without duplicating them in the usage copy. */
export function splitProductFaq(html: string) {
  const heading = /<h([2-6])\b[^>]*>\s*(?:<[^>]+>\s*)*(?:Sık(?:ça)?\s+(?:sorulan\s+)?sorular|Sıkça\s+Sorulan\s+Sorular)(?:\s*<[^>]+>)*\s*<\/h\1>/i.exec(html)
  if (!heading || heading.index === undefined) return { usage: html, faq: "" }
  return { usage: html.slice(0, heading.index).trim(), faq: html.slice(heading.index + heading[0].length).trim() }
}

export function productFaqItems(html: string) {
  const headings = Array.from(html.matchAll(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi))
  return headings.map((heading, index) => ({
    question: heading[2],
    answer: html.slice((heading.index || 0) + heading[0].length, headings[index + 1]?.index ?? html.length).trim(),
  })).filter(item => item.answer)
}
