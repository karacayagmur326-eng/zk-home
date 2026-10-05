"use client"

import { useState, useEffect } from "react"
import { Wrench, RefreshCw, AlertTriangle, X } from "@lib/icons"

export default function MaintenanceToggleButton() {
  const [loading, setLoading] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    fetch("/api/admin/maintenance")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.maintenance_mode === "boolean") {
          setMaintenanceMode(d.maintenance_mode)
        }
      })
      .catch(() => {})
  }, [])

  const executeToggle = async () => {
    if (loading || maintenanceMode === null) return
    const nextState = !maintenanceMode

    setLoading(true)
    setShowConfirmModal(false)

    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance_mode: nextState }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMaintenanceMode(data.maintenance_mode)
        ;(window as any).showAdminAlert?.(
          data.message,
          data.maintenance_mode ? "Bakım Modı Aktif" : "Site Yayında",
          data.maintenance_mode ? "error" : "success"
        )
      } else {
        ;(window as any).showAdminAlert?.(data.message || data.error || "İşlem başarısız.", "Hata", "error")
      }
    } catch (e: any) {
      ;(window as any).showAdminAlert?.("Bağlantı hatası: " + e.message, "Hata", "error")
    } finally {
      setLoading(false)
    }
  }

  if (maintenanceMode === null) return null

  const isTurningOn = !maintenanceMode

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        disabled={loading}
        title={
          maintenanceMode
            ? "Site şu anda BAKIM MODUNDA. Tıklayarak siteyi yayına alabilirsiniz."
            : "Tıklayarak siteyi bakıma alabilirsiniz."
        }
        className={`admin-btn ${
          maintenanceMode
            ? "admin-btn-danger"
            : "admin-btn-secondary"
        }`}
      >
        {loading ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : maintenanceMode ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <Wrench className="h-3.5 w-3.5 text-slate-600" />
        )}
        <span className="admin-header-action-label">
          {loading
            ? "Güncelleniyor..."
            : maintenanceMode
            ? "Bakım Modu (AKTİF)"
            : "Site Bakımı"}
        </span>
      </button>

      {/* ── Custom Brand Confirm Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" aria-labelledby="maintenance-confirm-title" className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-5 text-left animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              aria-label="Pencereyi kapat"
              className="admin-icon-button absolute right-4 top-4"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Header */}
            <div className="flex items-center gap-3 pr-8">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                  isTurningOn
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {isTurningOn ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Wrench className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Sistem Yönetimi
                </span>
                <h3 id="maintenance-confirm-title" className="text-base sm:text-lg font-bold text-slate-900">
                  {isTurningOn ? "Siteyi Bakım Moduna Al" : "Siteyi Yayına Al"}
                </h3>
              </div>
            </div>

            {/* Explanation Message */}
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
              {isTurningOn
                ? "Siteyi bakım moduna almak istediğinizden emin misiniz? Bu işlem tamamlandığında kullanıcılar mağazaya erişemeyecek ve özel bakım ekranı görecektir."
                : "Siteyi bakım modundan çıkarıp tekrar tüm ziyaretçilerin erişimine açmak istiyor musunuz?"}
            </p>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="admin-btn admin-btn-secondary whitespace-nowrap"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={executeToggle}
                className={`admin-btn whitespace-nowrap ${
                  isTurningOn
                    ? "admin-btn-danger-solid"
                    : "admin-btn-primary"
                }`}
              >
                {isTurningOn ? "Evet, Bakıma Al" : "Evet, Yayına Al"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
