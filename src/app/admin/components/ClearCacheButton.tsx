"use client"

import { useState } from "react"
import { Zap, RefreshCw, Check } from "@lib/icons"

export default function ClearCacheButton({
  variant = "header",
}: {
  variant?: "header" | "card" | "button"
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastCleared, setLastCleared] = useState<string | null>(null)

  const handleClearCache = async () => {
    if (loading) return
    setLoading(true)
    setSuccess(false)

    try {
      const res = await fetch("/api/admin/cache/clear", {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(true)
        const timeStr = new Date().toLocaleTimeString("tr-TR")
        setLastCleared(timeStr)
        ;(window as any).showAdminAlert?.(data.message || "Tüm önbellek başarıyla temizlendi.", "Başarılı", "success")
        setTimeout(() => setSuccess(false), 4000)
      } else {
        ;(window as any).showAdminAlert?.(data.message || "Önbellek temizlenirken hata oluştu.", "Hata", "error")
      }
    } catch (e: any) {
      ;(window as any).showAdminAlert?.("Önbellek temizlenirken hata oluştu: " + e.message, "Hata", "error")
    } finally {
      setLoading(false)
    }
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleClearCache}
        disabled={loading}
        title="Tüm mağaza önbelleğini ve veritabanı sorgu önbelleklerini derhal temizler"
        className={`admin-btn ${success ? "admin-btn-success" : "admin-btn-secondary"}`}
      >
        {loading ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : success ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Zap className="h-3.5 w-3.5 text-[#C98484]" />
        )}
        <span className="admin-header-action-label">
          {loading
            ? "Temizleniyor..."
            : success
              ? "Önbellek Temizlendi!"
              : "Önbelleği Temizle"}
        </span>
        {lastCleared && !loading && !success && (
          <span className="hidden lg:inline-block ml-1 text-[10px] opacity-80 font-normal">
            ({lastCleared})
          </span>
        )}
      </button>
    )
  }

  if (variant === "card") {
    return (
      <div className="admin-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="admin-section-icon">
                <Zap className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Site Performansı & Önbellek Yönetimi
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Mağazanızın yüksek hızda açılması için Next.js sayfa önbelleği ve veritabanı yanıtları hafızada tutulur. Ürün, kategori veya tema değişikliklerinde bu butona basarak önbelleği derhal yenileyebilirsiniz.
            </p>
            {lastCleared && (
              <p className="text-[11px] font-semibold text-emerald-700">
                Son temizleme işlemi saat {lastCleared}'de tamamlandı.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            disabled={loading}
            className={`admin-btn shrink-0 ${success ? "admin-btn-success" : "admin-btn-primary"}`}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : success ? (
              <Check className="h-4 w-4" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            <span>
              {loading
                ? "Temizleniyor..."
                : success
                  ? "Tüm Önbellek Temizlendi!"
                  : "Tüm Önbelleği Temizle"}
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClearCache}
      disabled={loading}
      className={`admin-btn ${success ? "admin-btn-success" : "admin-btn-primary"}`}
    >
      {loading ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Zap className="h-3.5 w-3.5" />
      )}
      <span>{loading ? "Temizleniyor..." : "Önbelleği Temizle"}</span>
    </button>
  )
}
