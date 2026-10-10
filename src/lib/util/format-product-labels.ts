/** Bold the label before the first colon on each product content line. */
export function formatProductLabels(html: string): string {
  return html.split(/(<(?:h[1-6]|pre|code|script|style|a)\b[^>]*>[\s\S]*?<\/(?:h[1-6]|pre|code|script|style|a)>|<\/?(?:p|div|li|ul|ol|blockquote|table|tr|td|th)\b[^>]*>|<br\b[^>]*>|\r?\n)/gi).map((line) => {
    if (!line || /^<(?:\/?(?:h[1-6]|pre|code|script|style|a|p|div|li|ul|ol|blockquote|table|tr|td|th)\b|br\b)/i.test(line)) return line
    const text = line.replace(/<[^>]*>/g, "")
    const colon = text.indexOf(":")
    if (colon < 1 || !text.slice(0, colon).trim() || /^\s*(?:https?|ftp|mailto|tel):/i.test(text) || /^\s*\d+:\d/.test(text)) return line
    let remaining = colon + 1
    let boldDepth = 0
    return line.split(/(<[^>]*>)/g).map((token) => {
      if (token.startsWith("<")) {
        if (/^<(?:strong|b)\b/i.test(token)) boldDepth++
        if (/^<\/(?:strong|b)>/i.test(token)) boldDepth = Math.max(0, boldDepth - 1)
        return token
      }
      const length = Math.min(remaining, token.length)
      remaining -= length
      if (!length || boldDepth || !token.slice(0, length).trim()) return token
      return `<strong>${token.slice(0, length)}</strong>${token.slice(length)}`
    }).join("")
  }).join("")
}
