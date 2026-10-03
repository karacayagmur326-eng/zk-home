"use client"

export interface UploadedMedia {
  id: string
  url: string
  filename?: string
}

// Leave room for multipart headers below Vercel's 4.5 MB request limit.
const MAX_UPLOAD_BYTES = 4_000_000

async function prepareImage(file: File): Promise<File> {
  if (file.size > 8 * 1024 * 1024) throw new Error("Dosya başına 8 MB izin verilir.")
  return file
}

export async function uploadMediaFiles(
  files: File[],
  onProgress?: (completed: number, total: number) => void,
) {
  const uploaded: UploadedMedia[] = []
  const errors: string[] = []
  for (const [index, original] of files.entries()) {
    try {
      const file = await prepareImage(original)
      let response: Response
      if (file.size > MAX_UPLOAD_BYTES) {
        const permission = await fetch("/api/admin/uploads/direct", { method: "POST" })
        const upload = await permission.json().catch(() => ({}))
        if (!permission.ok) throw new Error(upload.error || "Yükleme izni alınamadı.")
        const stored = await fetch(upload.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        })
        if (!stored.ok) throw new Error(`Medya deposuna yüklenemedi (HTTP ${stored.status}).`)
        response = await fetch("/api/admin/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: upload.key, filename: file.name }),
        })
      } else {
        const form = new FormData()
        form.append("files", file)
        response = await fetch("/api/admin/uploads", { method: "POST", body: form })
      }
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || (response.status === 413
          ? "Görsel boyutu sunucu sınırını aşıyor."
          : `Yükleme başarısız (HTTP ${response.status}).`))
      }
      if (!Array.isArray(data.files) || !data.files.length) {
        throw new Error("Sunucu yüklenen görseli doğrulayamadı.")
      }
      uploaded.push(...data.files)
    } catch (error) {
      errors.push(`${original.name}: ${error instanceof Error ? error.message : "Yükleme başarısız."}`)
    }
    onProgress?.(index + 1, files.length)
  }
  return { uploaded, errors }
}
