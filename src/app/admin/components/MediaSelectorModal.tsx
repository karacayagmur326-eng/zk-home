"use client"
import React, { useEffect, useState } from "react"
import { uploadMediaFiles } from "@lib/admin/upload-media"
import {
  APP_ICON_OPTIONS as SELECTABLE_ICONS,
  Wrench,
} from "@lib/icons"

interface MediaFile {
  id: string
  url: string
  filename?: string
  size_bytes?: number
  title?: string
  alt_text?: string
  caption?: string
  description?: string
  created_at?: string
}

interface MediaSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (urls: string[]) => void
  multi?: boolean
  allowIcons?: boolean
  addedUrls?: string[]
}

export default function MediaSelectorModal({
  isOpen,
  onClose,
  onSelect,
  multi = false,
  allowIcons = true,
  addedUrls = [],
}: MediaSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "library" | "icons">("library")
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [search, setSearch] = useState("")
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("media_modal_sort_preference") || "date_desc"
    }
    return "date_desc"
  })

  function handleSortChange(newSort: string) {
    setSortBy(newSort)
    if (typeof window !== "undefined") {
      localStorage.setItem("media_modal_sort_preference", newSort)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
      setSelectedUrls([])
    }
  }, [isOpen])

  function fetchMedia() {
    setLoading(true)
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => {
        setFiles(d.files || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList?.length) return
    setUploading(true)
    const input = e.target
    const selectedFiles = Array.from(fileList)
    setUploadProgress(`0/${selectedFiles.length}`)
    try {
      const { uploaded, errors } = await uploadMediaFiles(selectedFiles, (done, total) => {
        setUploadProgress(`${done}/${total}`)
      })
      if (uploaded.length) {
        const newUrls = uploaded.map((file) => file.url)
        if (newUrls.length > 0) {
          if (multi) {
            setSelectedUrls(prev => Array.from(new Set([...prev, ...newUrls])))
          } else {
            setSelectedUrls([newUrls[0]])
          }
        }
        handleSortChange("date_desc")
        fetchMedia()
        setActiveTab("library")
      }
      if (typeof window !== "undefined" && (window as any).showAdminAlert) {
        (window as any).showAdminAlert(
          errors.length ? `${uploaded.length} görsel yüklendi. ${errors.join("\n")}` : `${uploaded.length} görsel yüklendi ve otomatik seçildi!`,
          errors.length ? "Yükleme sonucu" : "Başarılı",
          errors.length ? "error" : "success",
        )
      }
    } catch (err: any) {
      console.error(err)
      const errorMessage = err?.message ? `Yükleme hatası: ${err.message}` : "Dosya yüklenirken bir bağlantı hatası oluştu."
      if (typeof window !== "undefined" && (window as any).showAdminAlert) {
        (window as any).showAdminAlert(errorMessage, "Hata", "error")
      }
    } finally {
      setUploading(false)
      input.value = ""
      setUploadProgress("")
    }
  }

  function getDisplayName(file: { filename?: string; url: string }) {
    const raw = file.filename || file.url.split("/").pop() || ""
    let decoded = raw
    try {
      decoded = decodeURIComponent(raw)
    } catch (e) {
      decoded = raw
    }
    return decoded.replace(/^\d{13}-/, "")
  }

  function getMediaTimestamp(f: { id?: string; filename?: string; url?: string; created_at?: string }): number {
    if (f.created_at) {
      const ts = new Date(f.created_at).getTime()
      if (!isNaN(ts) && ts > 0) return ts
    }

    const filename = f.filename || (f.url ? f.url.split("/").pop() : "") || ""
    const id = f.id || ""
    const epochMatch = filename.match(/^(\d{13})/) || id.match(/^(\d{13})/) || id.match(/media_(\d{13})/)
    if (epochMatch) {
      const ts = parseInt(epochMatch[1], 10)
      if (!isNaN(ts) && ts > 1600000000000) return ts
    }

    return 0
  }

  const searchLower = search.trim().toLowerCase()
  const searchNormalized = searchLower.replace(/[\s_-]+/g, "")

  const filteredMedia = files
    .filter((f) => {
      if (!searchLower) return true
      const displayName = getDisplayName(f).toLowerCase()
      const rawFilename = (f.filename || "").toLowerCase()
      const url = (f.url || "").toLowerCase()
      let decodedUrl = url
      try { decodedUrl = decodeURIComponent(url) } catch {}
      const id = (f.id || "").toLowerCase()
      const matchText = `${displayName} ${rawFilename} ${url} ${decodedUrl} ${id}`.replace(/[\s_-]+/g, "")

      return (
        displayName.includes(searchLower) ||
        rawFilename.includes(searchLower) ||
        url.includes(searchLower) ||
        decodedUrl.includes(searchLower) ||
        id.includes(searchLower) ||
        matchText.includes(searchNormalized)
      )
    })
    .sort((a, b) => {
      const timeA = getMediaTimestamp(a)
      const timeB = getMediaTimestamp(b)

      if (sortBy === "date_desc") {
        if (timeB !== timeA) return timeB - timeA
        return (b.id || "").localeCompare(a.id || "")
      }
      if (sortBy === "date_asc") {
        if (timeA !== timeB) return timeA - timeB
        return (a.id || "").localeCompare(b.id || "")
      }
      if (sortBy === "name_asc") {
        return getDisplayName(a).localeCompare(getDisplayName(b), "tr")
      }
      if (sortBy === "name_desc") {
        return getDisplayName(b).localeCompare(getDisplayName(a), "tr")
      }
      if (sortBy === "size_asc") {
        return (a.size_bytes || 0) - (b.size_bytes || 0)
      }
      if (sortBy === "size_desc") {
        return (b.size_bytes || 0) - (a.size_bytes || 0)
      }
      return 0
    })

  const filteredIcons = SELECTABLE_ICONS.filter(
    (i) =>
      !search ||
      i.label.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggleSelect(url: string) {
    if (multi) {
      setSelectedUrls((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
      )
    } else {
      setSelectedUrls([url])
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      zIndex: 99999,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: 16
    }}>
      <style>{`
        .media-modal-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .media-modal-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        .media-modal-card:hover .media-modal-img {
          transform: scale(1.05);
        }
        .media-modal-card:hover .media-modal-filename {
          opacity: 1 !important;
        }
        .media-modal-tab-btn {
          transition: all 0.15s ease-in-out;
        }
      `}</style>
      <div style={{
        background: "#ffffff", width: "100%", maxWidth: 920, height: "85vh", maxHeight: 720,
        borderRadius: 20, display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)", border: "1px solid rgba(226, 232, 240, 0.8)"
      }}>
        {/* Modal Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(to bottom, #ffffff, #f8fafc)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: "rgba(201, 132, 132, 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Ortam Dosyası & İkon Seç</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 500 }}>Görsel veya ikon seçin ya da bilgisayarınızdan yükleyin</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, cursor: "pointer", color: "#64748b", transition: "all 0.15s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b" }}
          >×</button>
        </div>

        {/* Modern Segmented Tab Bar + Sort Selector */}
        <div style={{ padding: "12px 24px 0 24px", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{
            display: "inline-flex", background: "#f1f5f9", padding: 4, borderRadius: 12, gap: 4
          }}>
            <button
              type="button"
              className="media-modal-tab-btn"
              onClick={() => setActiveTab("library")}
              style={{
                padding: "8px 16px", border: "none", cursor: "pointer",
                borderRadius: 9, fontSize: 13, fontWeight: 700,
                background: activeTab === "library" ? "#ffffff" : "transparent",
                color: activeTab === "library" ? "#C98484" : "#64748b",
                boxShadow: activeTab === "library" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
              }}
            >
              🖼️ Ortam Kütüphanesi
            </button>
            {allowIcons && (
              <button
                type="button"
                className="media-modal-tab-btn"
                onClick={() => setActiveTab("icons")}
                style={{
                  padding: "8px 16px", border: "none", cursor: "pointer",
                  borderRadius: 9, fontSize: 13, fontWeight: 700,
                  background: activeTab === "icons" ? "#ffffff" : "transparent",
                  color: activeTab === "icons" ? "#C98484" : "#64748b",
                  boxShadow: activeTab === "icons" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Wrench aria-hidden="true" size={14} />
                  İkon Kütüphanesi
                </span>
              </button>
            )}
            <button
              type="button"
              className="media-modal-tab-btn"
              onClick={() => setActiveTab("upload")}
              style={{
                padding: "8px 16px", border: "none", cursor: "pointer",
                borderRadius: 9, fontSize: 13, fontWeight: 700,
                background: activeTab === "upload" ? "#ffffff" : "transparent",
                color: activeTab === "upload" ? "#C98484" : "#64748b",
                boxShadow: activeTab === "upload" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
              }}
            >
              📤 Yeni Dosya Yükle
            </button>
          </div>

          {/* Sort Selector (Persisted in localStorage) */}
          {activeTab !== "upload" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0f172a",
                  outline: "none",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
              >
                <option value="date_desc">📅 En Yeni (Tarihe Göre)</option>
                <option value="date_asc">⏳ En Eski (Tarihe Göre)</option>
                <option value="name_asc">🔤 İsme Göre (A-Z)</option>
                <option value="name_desc">🔤 İsme Göre (Z-A)</option>
                <option value="size_desc">🐘 Boyuta Göre (Büyükten Küçüğe)</option>
                <option value="size_asc">🔍 Boyuta Göre (Küçükten Büyüğe)</option>
              </select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        {activeTab !== "upload" && (
          <div style={{ padding: "14px 24px 4px 24px", background: "#ffffff" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder={activeTab === "icons" ? "İkonlarda ara (matkap, akü, kargo, kilit...)" : "Görsellerde ara..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  fontSize: 13,
                  boxSizing: "border-box",
                  background: "#f8fafc",
                  color: "#0f172a",
                  outline: "none",
                  transition: "all 0.15s"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#C98484"; e.currentTarget.style.background = "#fff" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc" }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: 12, pointerEvents: "none" }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#ffffff" }}>
          {activeTab === "upload" ? (
            <div style={{
              border: "2px dashed #cbd5e1", borderRadius: 16, height: "100%",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: 40, textAlign: "center", background: "#f8fafc"
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", background: "rgba(201, 132, 132, 0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C98484" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: 16, fontWeight: 800 }}>Yüklemek için dosyaları buraya sürükleyin</h4>
              <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: 13, fontWeight: 500 }}>PNG, JPG, SVG veya WEBP formatları desteklenmektedir.</p>
              <label style={{
                background: "linear-gradient(135deg, #C98484, #ff7a28)", border: "none", borderRadius: 12,
                padding: "11px 24px", fontSize: 13, fontWeight: 800, cursor: "pointer",
                color: "#ffffff", boxShadow: "0 4px 14px rgba(201, 132, 132, 0.35)", transition: "all 0.15s"
              }}>
                {uploading ? `⏳ Yükleniyor... ${uploadProgress}` : "💻 Bilgisayardan Dosya Seç"}
                <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
              </label>
            </div>
          ) : activeTab === "library" ? (
            <div style={{ height: "100%" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontWeight: 600 }}>Görseller yükleniyor...</div>
              ) : filteredMedia.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontWeight: 600 }}>Aramaya uygun görsel bulunamadı.</div>
              ) : (
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: 14, paddingBottom: 10
                }}>
                  {filteredMedia.map((file) => {
                    const isSelected = selectedUrls.includes(file.url)
                    const isAdded = addedUrls.includes(file.url)
                    const displayName = getDisplayName(file)
                    return (
                      <div
                        key={file.id}
                        onClick={() => { if (!isAdded) toggleSelect(file.url) }}
                        role="button"
                        tabIndex={isAdded ? -1 : 0}
                        aria-disabled={isAdded}
                        aria-label={`${displayName}${isAdded ? " — Eklendi" : ""}`}
                        onKeyDown={(event) => {
                          if (!isAdded && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault()
                            toggleSelect(file.url)
                          }
                        }}
                        title={isAdded ? `${displayName} — Bu ürüne eklendi` : displayName}
                        style={{
                          border: isAdded ? "2.5px solid #16a34a" : isSelected ? "2.5px solid #C98484" : "1.5px solid #e2e8f0",
                          borderRadius: 14, overflow: "hidden", cursor: isAdded ? "default" : "pointer", position: "relative",
                          background: isAdded ? "#f0fdf4" : isSelected ? "#fcf7f6" : "#ffffff", boxSizing: "border-box",
                          display: "flex", flexDirection: "column", alignItems: "center",
                          padding: 6, transition: "all 0.15s ease-in-out"
                        }}
                        className="media-modal-card"
                      >
                        {/* Image Container with Full Contain Fit */}
                        <div style={{
                          width: "100%", aspectRatio: "1/1", position: "relative",
                          background: "#f8fafc", borderRadius: 10, overflow: "hidden",
                          display: "flex", alignItems: "center", justifyContent: "center", padding: 6
                        }}>
                          <img
                            src={file.url}
                            alt={displayName}
                            onError={(e) => {
                              const target = e.currentTarget
                              if (!target.dataset.retried) {
                                target.dataset.retried = "true"
                                target.src = file.url.includes("?") ? `${file.url}&retry=${Date.now()}` : `${file.url}?retry=${Date.now()}`
                              }
                            }}
                            className="media-modal-img"
                            style={{
                              maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
                              transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}
                          />
                          {isAdded && <span style={{ position: "absolute", top: 6, right: 6, background: "#15803d", color: "white", borderRadius: 6, padding: "4px 7px", fontSize: 11, fontWeight: 600, zIndex: 5 }}>✓ Eklendi</span>}
                          {isSelected && !isAdded && (
                            <div style={{
                              position: "absolute", top: 6, right: 6,
                              background: "linear-gradient(135deg, #C98484, #ff7a28)",
                              color: "#fff", width: 22, height: 22, borderRadius: "50%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: "bold", zIndex: 5,
                              boxShadow: "0 2px 6px rgba(201, 132, 132, 0.4)"
                            }}>
                              ✓
                            </div>
                          )}
                        </div>
                        
                        {/* Filename Always Visible Underneath Image */}
                        <div
                          style={{
                            width: "100%", padding: "6px 4px 2px 4px",
                            fontSize: 10, fontWeight: 700,
                            color: isSelected ? "#c2410c" : "#334155",
                            textAlign: "center", whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis"
                          }}
                          title={displayName}
                        >
                          {displayName}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Icon Library Tab inside Modal */
            <div style={{ height: "100%" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))",
                gap: 12, paddingBottom: 10
              }}>
                {filteredIcons.map((item) => {
                  const isSelected = selectedUrls.includes(item.name)
                  return (
                    <div
                      key={item.name}
                      onClick={() => toggleSelect(item.name)}
                      style={{
                        border: isSelected ? "2.5px solid #C98484" : "1.5px solid #e2e8f0",
                        borderRadius: 12, padding: 14,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", background: isSelected ? "#fcf7f6" : "#fafafa",
                        transition: "all 0.15s ease-in-out"
                      }}
                      className="media-modal-card"
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: "1px solid #edf2f7", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", marginBottom: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", textAlign: "center" }}>{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: "linear-gradient(to top, #ffffff, #f8fafc)"
        }}>
          {/* Bottom Left: Bilgisayardan Seç Button */}
          <div>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 10,
              background: uploading ? "#cbd5e1" : "linear-gradient(135deg, #1e293b, #0f172a)",
              color: "#ffffff", fontSize: 13, fontWeight: 700,
              cursor: uploading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
              border: "1px solid #334155",
              transition: "all 0.15s ease-in-out"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>{uploading ? `Yükleniyor... ${uploadProgress}` : "Bilgisayardan Yükle & Seç"}</span>
              <input
                type="file"
                accept="image/*"
                multiple={multi}
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 18px", border: "1.5px solid #e2e8f0", background: "#ffffff",
                borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#64748b", cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#0f172a" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b" }}
            >
              İptal
            </button>
            <button
              onClick={() => {
                if (selectedUrls.length > 0) {
                  onSelect(selectedUrls)
                  onClose()
                }
              }}
              disabled={selectedUrls.length === 0}
              style={{
                padding: "10px 22px", border: "none",
                background: selectedUrls.length > 0
                  ? "linear-gradient(135deg, #C98484, #ff7a28)"
                  : "#e2e8f0",
                color: selectedUrls.length > 0 ? "#ffffff" : "#94a3b8",
                borderRadius: 10, fontSize: 13, fontWeight: 800,
                cursor: selectedUrls.length > 0 ? "pointer" : "not-allowed",
                boxShadow: selectedUrls.length > 0 ? "0 4px 14px rgba(201, 132, 132, 0.35)" : "none",
                transition: "all 0.15s ease-in-out"
              }}
            >
              Seçilen Elemanı Kullan ({selectedUrls.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
