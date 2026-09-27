"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="tr">
      <body>
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Bir hata oluştu</h2>
          <p>{error.message || "Beklenmeyen bir sistem hatası meydana geldi."}</p>
          <button
            onClick={() => reset()}
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
