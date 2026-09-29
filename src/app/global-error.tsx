"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const staleAction = /Server Action .* was not found|Failed to find Server Action/i.test(error.message)

  useEffect(() => {
    if (!staleAction) return
    try {
      const key = "zkhome:stale-action-reload"
      const lastReload = Number(sessionStorage.getItem(key) || 0)
      if (Date.now() - lastReload < 30_000) return
      sessionStorage.setItem(key, String(Date.now()))
      window.location.reload()
    } catch {
      // The retry button below still lets the visitor request the current build.
    }
  }, [staleAction])

  return (
    <html lang="tr">
      <body>
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Bir hata oluştu</h2>
          <p>{staleAction ? "Sayfa güncellendi. En yeni sürüm yükleniyor." : "Beklenmeyen bir sistem hatası meydana geldi."}</p>
          <button
            onClick={() => staleAction ? window.location.reload() : reset()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#C98484",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Tekrar Deneyin
          </button>
        </div>
      </body>
    </html>
  )
}
