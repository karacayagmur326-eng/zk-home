"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function ExcelImportPage() {
  const router = useRouter()
  const [importing, setImporting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.toLocaleLowerCase("tr-TR").endsWith(".xlsx")) {
        setSelectedFile(file)
      } else {
        showError("Lütfen yalnızca Excel (.xlsx) dosyası yükleyin.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const showError = (msg: string) => {
    if (typeof window !== "undefined") {
      ;(window as any).showAdminAlert?.(msg, "Hata", "error")
    }
  }

  async function handleExcelImport() {
    if (!selectedFile) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          ;(window as any).showAdminAlert?.(
            `${data.createdCount} yeni ürün eklendi. ${data.createdBrandCount} yeni marka oluşturuldu. ${data.linkedBrandCount} mevcut ürün markasına bağlandı. ${data.skippedCount} ürün zaten mevcuttu.`,
            "İçe Aktarım Başarılı",
            "success"
          )
        }
        router.push("/admin/urunler")
      } else {
        throw new Error(data.error || "İçe aktarım işlemi sırasında bir hata oluştu.")
      }
    } catch (e: any) {
      showError(e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ maxWidth: 650, margin: "32px auto" }}>
      <div className="admin-card" style={{ padding: "32px 40px", borderRadius: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(201,132,132,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#C98484"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1d2327" }}>
              Excel Katalog İçe Aktarım
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#646970", fontSize: 13 }}>
              Excel dosyanızı yükleyerek tüm katalog verilerini anında güncelleyin.
            </p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          style={{
            border: dragActive ? "2px dashed #C98484" : "2px dashed #cbd5e1",
            borderRadius: 12,
            backgroundColor: dragActive ? "rgba(201,132,132,0.02)" : "#f8fafc",
            padding: "48px 24px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: 24,
            position: "relative"
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ color: selectedFile ? "#C98484" : "#64748b" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            {selectedFile ? (
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1e293b" }}>
                  {selectedFile.name}
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB - Değiştirmek için tıklayın veya sürükleyin
                </p>
              </div>
            ) : (
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                  Excel dosyasını buraya sürükleyin veya tıklayıp seçin
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Desteklenen biçim: .xlsx (en fazla 10 MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
          <button
            onClick={() => router.push("/admin/urunler")}
            className="admin-btn admin-btn-secondary"
            disabled={importing}
            style={{ borderRadius: 8 }}
          >
            Vazgeç
          </button>

          {!selectedFile ? (
            <button
              onClick={triggerFileSelect}
              className="admin-btn admin-btn-primary"
              disabled={importing}
              style={{ borderRadius: 8 }}
            >
              Dosya Seç
            </button>
          ) : (
            <>
              <button
                onClick={triggerFileSelect}
                className="admin-btn admin-btn-secondary"
                disabled={importing}
                style={{ borderRadius: 8 }}
              >
                Dosya Değiştir
              </button>
              <button
                onClick={handleExcelImport}
                className="admin-btn admin-btn-primary"
                disabled={importing}
                style={{ minWidth: 160, justifyContent: "center", borderRadius: 8 }}
              >
                {importing ? (
                  <>
                    <span className="admin-loader-spinner" />
                    Aktarılıyor...
                  </>
                ) : (
                  "İçeri Aktar"
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        .admin-loader-spinner {
          display: inline-block;
          width: 14 h-14;
          width: 14px;
          height: 14px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: adminSpin 0.8s linear infinite;
          margin-right: 8px;
        }
        @keyframes adminSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
