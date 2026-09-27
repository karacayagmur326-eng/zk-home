import "server-only"
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

function getCandidateKeys(): Buffer[] {
  const sources = [
    process.env.INTEGRATION_ENCRYPTION_KEY,
    process.env.ADMIN_JWT_SECRET,
  ].filter(Boolean) as string[]

  if (!sources.length) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY yapılandırılmamış.")
  }

  const unique = Array.from(new Set(sources.map((s) => String(s).replace(/^["']|["']$/g, "").trim())))
  return unique.map((src) => createHash("sha256").update(src).digest())
}

export function encryptSettings(value: Record<string, string>) {
  const iv = randomBytes(12)
  const key = getCandidateKeys()[0]
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".")
}

export function decryptSettings(value?: string | null): Record<string, string> {
  if (!value) return {}

  // Support plain JSON fallback
  if (value.startsWith("{") && value.endsWith("}")) {
    try {
      return JSON.parse(value)
    } catch {}
  }

  const parts = value.split(".")
  if (parts.length !== 3) return {}

  const [ivText, tagText, encryptedText] = parts

  for (const key of getCandidateKeys()) {
    try {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(ivText, "base64url")
      )
      decipher.setAuthTag(Buffer.from(tagText, "base64url"))
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedText, "base64url")),
        decipher.final(),
      ])
      const parsed = JSON.parse(decrypted.toString("utf8"))
      if (parsed && typeof parsed === "object") {
        return parsed
      }
    } catch {
      // Try next candidate key
    }
  }

  console.warn("[decryptSettings] Unable to decrypt settings with known keys.")
  return {}
}
