const acronyms = new Set(["ZK", "LED", "TV", "USB", "KVKK", "SSS"])

export function turkishTitleCase(value: string): string {
  return value.replace(/\p{L}+/gu, (word) => {
    const upper = word.toLocaleUpperCase("tr-TR")
    if (acronyms.has(upper)) return upper
    const lower = word.toLocaleLowerCase("tr-TR")
    return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1)
  })
}
