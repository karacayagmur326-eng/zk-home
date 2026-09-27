"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ConfirmModal from "../components/ConfirmModal"
import { Check, FileUp, Grid2X2, ImageIcon, List, LoaderCircle, RotateCcw, Trash2 } from "@lib/icons"

interface MediaFile {
  id: string
  url: string
  filename?: string
  storage_key?: string
  mime_type?: string
  size_bytes?: number
  title?: string
  alt_text?: string
  caption?: string
  description?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string
}

type MediaDraft = {
  filename: string
  title: string
  alt_text: string
  caption: string
  description: string
}

export default function MediaLibraryPage() {
  const router = useRouter()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  
  // Lightbox Preview State
  const [lightboxFile, setLightboxFile] = useState<MediaFile | null>(null)
  const [mediaDraft, setMediaDraft] = useState<MediaDraft | null>(null)
  const [savingMedia, setSavingMedia] = useState(false)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [mediaTab, setMediaTab] = useState<"active" | "trash">("active")
  const [mediaCounts, setMediaCounts] = useState({ active_count: 0, deleted_count: 0 })

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

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
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

  function fetchMedia() {
    setLoading(true)
    fetch(`/api/admin/media${mediaTab === "trash" ? "?trash=true" : ""}`)
      .then(r => { if (r.status === 401) { router.push("/admin"); return null } return r.json() })
      .then(d => {
        if (!d) return
        setFiles(d.files || [])
        setMediaCounts(d.counts || { active_count: 0, deleted_count: 0 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    clearSelection()
    setSelected(null)
    setLightboxFile(null)
    fetchMedia()
  }, [mediaTab])

  useEffect(() => {
    if (!lightboxFile) {
      setMediaDraft(null)
      return
    }
    setMediaDraft({
      filename: lightboxFile.filename || "",
      title: lightboxFile.title || getDisplayName(lightboxFile).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      alt_text: lightboxFile.alt_text || "",
      caption: lightboxFile.caption || "",
      description: lightboxFile.description || "",
    })
  }, [lightboxFile?.id])

  // Keyboard navigation for Lightbox
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!lightboxFile) return
      if (e.key === "Escape") setLightboxFile(null)
      if (e.key === "ArrowLeft") {
        const idx = filtered.findIndex((f) => f.id === lightboxFile.id)
        if (idx > 0) setLightboxFile(filtered[idx - 1])
      }
      if (e.key === "ArrowRight") {
        const idx = filtered.findIndex((f) => f.id === lightboxFile.id)
        if (idx >= 0 && idx < filtered.length - 1) setLightboxFile(filtered[idx + 1])
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxFile, files, search, sortBy])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList?.length) return
    setUploading(true)
    const form = new FormData()
    Array.from(fileList).forEach(f => form.append("files", f))
    try {
      const res = await fetch("/api/admin/uploads", { method: "POST", body: form })
      if (res.ok) {
        const data = await res.json()
        const uploadedCount = Array.isArray(data.files) ? data.files.length : fileList.length
        handleSortChange("date_desc")
        showToast(`${uploadedCount} dosya yüklendi!`, "success")
        await fetchMedia()
      }
      else { const d = await res.json(); showToast("Hata: " + (d.error || "Yükleme başarısız"), "error") }
    } catch (err: any) {
      showToast("Hata: " + err.message, "error")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  // Single delete
  async function handleDelete(id: string) {
    setConfirmDeleteId(id)
  }

  async function performSingleDelete() {
    if (!confirmDeleteId) return
    const permanent = mediaTab === "trash"
    const res = await fetch(
      `/api/admin/media/${confirmDeleteId}${permanent ? "?permanent=true" : ""}`,
      { method: "DELETE" },
    )
    if (res.ok) {
      showToast(permanent ? "Dosya kalıcı olarak silindi." : "Dosya çöp kutusuna taşındı.", "info")
      if (selected === confirmDeleteId) setSelected(null)
      if (lightboxFile?.id === confirmDeleteId) setLightboxFile(null)
      setSelectedIds(prev => prev.filter(i => i !== confirmDeleteId))
      fetchMedia()
    } else {
      showToast("Silinemedi", "error")
    }
    setConfirmDeleteId(null)
  }

  // Shift + Click Range Selection & Toggle
  function toggleSelectFile(id: string, index: number, e?: React.MouseEvent) {
    if (e) e.stopPropagation()

    if (e?.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== index) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeIds = filtered.slice(start, end + 1).map(f => f.id)

      setSelectedIds(prev => {
        const set = new Set(prev)
        rangeIds.forEach(rId => set.add(rId))
        return Array.from(set)
      })
    } else {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      )
    }
    setLastSelectedIndex(index)
  }

  function handleSelectAll() {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(f => f.id))
    }
  }

  function clearSelection() {
    setSelectedIds([])
    setLastSelectedIndex(null)
  }

  async function performBulkDelete() {
    if (!selectedIds.length) return
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, permanent: mediaTab === "trash" }),
      })
      if (res.ok) {
        const d = await res.json()
        showToast(
          mediaTab === "trash"
            ? `${d.count || selectedIds.length} dosya kalıcı olarak silindi.`
            : `${d.count || selectedIds.length} dosya çöp kutusuna taşındı.`,
          "info",
        )
        setSelectedIds([])
        setSelected(null)
        setLastSelectedIndex(null)
        fetchMedia()
      } else {
        const d = await res.json()
        showToast("Toplu silme hatası: " + (d.error || "İşlem başarısız"), "error")
      }
    } catch (err: any) {
      showToast("Hata: " + err.message, "error")
    } finally {
      setConfirmBulkDelete(false)
    }
  }

  async function restoreFiles(ids: string[]) {
    if (!ids.length) return
    try {
      const response = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action: "restore" }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Geri yükleme başarısız.")
      showToast(`${result.count || ids.length} dosya geri yüklendi.`, "success")
      clearSelection()
      setSelected(null)
      if (lightboxFile && ids.includes(lightboxFile.id)) setLightboxFile(null)
      fetchMedia()
    } catch (error: any) {
      showToast(error?.message || "Dosya geri yüklenemedi.", "error")
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    showToast("Link kopyalandı!", "success")
  }

  function downloadFile(url: string, filename?: string) {
    const link = document.createElement("a")
    link.href = url
    link.download = filename || url.split("/").pop() || "gorsel"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function saveMediaDetails() {
    if (!lightboxFile || !mediaDraft) return
    setSavingMedia(true)
    try {
      const response = await fetch(`/api/admin/media/${lightboxFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaDraft),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Görsel güncellenemedi.")
      const updated = payload.file as MediaFile
      setFiles((current) => current.map((file) => file.id === updated.id ? updated : file))
      setLightboxFile(updated)
      showToast(
        payload.references_updated
          ? "Görsel ve sitedeki tüm kullanımları güncellendi."
          : "Görsel SEO bilgileri güncellendi.",
        "success",
      )
    } catch (error: any) {
      showToast(error?.message || "Görsel güncellenemedi.", "error")
    } finally {
      setSavingMedia(false)
    }
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

  const filtered = files
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

  const selectedFile = selected ? files.find(f => f.id === selected) : null
  const allFilteredSelected = filtered.length > 0 && filtered.every(f => selectedIds.includes(f.id))

  const toastColors: Record<string, string> = {
    success: "#00a32a", error: "#d63638", info: "#C98484"
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          padding: "10px 20px", borderRadius: 4, color: "#fff", fontWeight: 600, fontSize: 13,
          background: toastColors[toast.type],
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast.message}
        </div>
      )}

      {/* Sticky Header Panel */}
      <div style={{
        position: "sticky",
        top: 72,
        zIndex: 50,
        background: "#ffffff",
        marginTop: -24,
        paddingTop: 20,
        paddingBottom: 16,
        paddingLeft: 28,
        paddingRight: 28,
        marginLeft: -28,
        marginRight: -28,
        marginBottom: 20,
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 4px 12px rgba(16, 24, 40, 0.04)",
      }}>
        {/* Title & primary action row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#172033" }}>Ortam Kütüphanesi</h2>
            <p style={{ margin: "3px 0 10px", fontSize: 12, color: "#697386" }}>Görselleri yükleyin, bulun ve SEO bilgilerini yönetin.</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setMediaTab("active")}
                className={mediaTab === "active" ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-secondary"}
                style={{ padding: "6px 11px", fontSize: 11 }}
              >
                Tüm Medya ({mediaCounts.active_count})
              </button>
              <button
                type="button"
                onClick={() => setMediaTab("trash")}
                className={mediaTab === "trash" ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-secondary"}
                style={{ padding: "6px 11px", fontSize: 11 }}
              >
                <Trash2 size={13} /> Silinenler ({mediaCounts.deleted_count})
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* View toggle */}
            <div style={{ display: "flex", border: "1px solid #c3c4c7", borderRadius: 4, overflow: "hidden" }}>
              {(["grid", "list"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: "6px 12px", border: "none", cursor: "pointer",
                  background: view === v ? "#1d2327" : "#fff",
                  color: view === v ? "#fff" : "#646970",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {v === "grid" ? <Grid2X2 size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>
            {mediaTab === "active" && <label style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 4,
              background: uploading ? "#c3c4c7" : "#C98484",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer",
              border: "1px solid " + (uploading ? "#c3c4c7" : "#d94f00"),
            }}>
              {uploading ? <><LoaderCircle size={16} className="animate-spin" /> Yükleniyor...</> : <><FileUp size={16} /> Dosya Ekle</>}
              <input type="file" accept="image/*" multiple onChange={handleUpload}
                disabled={uploading} style={{ display: "none" }} />
            </label>}
          </div>
        </div>

        {/* Search + count + Bulk action bar */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input className="admin-input" style={{ maxWidth: 220 }}
              placeholder="Dosya ara..." value={search} onChange={e => setSearch(e.target.value)} />
            
            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: "1px solid #c3c4c7",
                background: "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                color: "#2c3338",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="date_desc">En yeni yüklenen</option>
              <option value="date_asc">En eski yüklenen</option>
              <option value="name_asc">Dosya adı: A-Z</option>
              <option value="name_desc">Dosya adı: Z-A</option>
              <option value="size_desc">Dosya boyutu: büyükten</option>
              <option value="size_asc">Dosya boyutu: küçükten</option>
            </select>

            <span style={{ color: "#646970", fontSize: 12, fontWeight: 600 }}>{filtered.length} öge</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            {/* Select All Checkbox Button */}
            {filtered.length > 0 && (
              <button
                onClick={handleSelectAll}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 4, border: "1px solid #c3c4c7",
                  background: allFilteredSelected ? "#fcf7f6" : "#fff",
                  color: allFilteredSelected ? "#C98484" : "#2c3338",
                  fontSize: 12, fontWeight: 700, cursor: "pointer"
                }}
                title="Tümünü Seç / Kaldır"
              >
                <div style={{
                  width: 14, height: 14, borderRadius: 3,
                  border: allFilteredSelected ? "2px solid #C98484" : "2px solid #646970",
                  background: allFilteredSelected ? "#C98484" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff"
                }}>
                  {allFilteredSelected && <Check size={10} strokeWidth={4} />}
                </div>
                <span>{allFilteredSelected ? "Tümünü Kaldır" : "Tümünü Seç"}</span>
              </button>
            )}

            {/* Bulk Selection Badge & Action Button */}
            {selectedIds.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fcf7f6", padding: "4px 10px", borderRadius: 6, border: "1px solid #fed7aa" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#c2410c" }}>
                  {selectedIds.length} dosya seçildi
                </span>

                <button
                  onClick={clearSelection}
                  style={{
                    background: "none", border: "none", color: "#9a3412",
                    fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "underline"
                  }}
                >
                  Seçimi Temizle
                </button>

                <button
                  type="button"
                  onClick={() => restoreFiles(selectedIds)}
                  style={{
                    display: mediaTab === "trash" ? "inline-flex" : "none",
                    alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 4,
                    border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <RotateCcw size={14} /> Seçilenleri Geri Yükle
                </button>

                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 12px", borderRadius: 4, border: "none",
                    background: "#d63638", color: "#fff", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", boxShadow: "0 2px 4px rgba(214, 54, 56, 0.25)"
                  }}
                >
                  <Trash2 size={14} />
                  {mediaTab === "trash" ? "Kalıcı Sil" : "Çöp Kutusuna Taşı"} ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid / List View Area */}
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#646970" }}>
              Yükleniyor...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#646970" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "#a7aaad" }}>
                <ImageIcon size={48} strokeWidth={1.5} />
              </div>
              <p style={{ margin: 0 }}>
                {search
                  ? "Aramanızla eşleşen dosya bulunamadı."
                  : mediaTab === "trash"
                    ? "Çöp kutusu boş."
                    : "Kütüphanede hiç dosya yok. Dosya ekleyin!"}
              </p>
            </div>
          ) : view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
              {filtered.map((file, index) => {
                const isChecked = selectedIds.includes(file.id)
                const isSingleSelected = selected === file.id
                const displayName = getDisplayName(file)
                return (
                  <div
                    key={file.id}
                    onClick={() => setLightboxFile(file)}
                    title={`${displayName} - Büyük halini görmek için tıklayın`}
                    style={{
                      position: "relative", aspectRatio: "1/1", borderRadius: 8,
                      border: isChecked
                        ? "3px solid #C98484"
                        : isSingleSelected
                        ? "2px solid #1d2327"
                        : "1.5px solid #e2e8f0",
                      overflow: "hidden", cursor: "pointer",
                      background: "#f8fafc",
                      boxShadow: isChecked ? "0 0 0 2px rgba(201, 132, 132, 0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
                      userSelect: "none",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                    className="media-card-item"
                  >
                    {/* Checkbox badge on top-left of image */}
                    <div
                      onClick={(e) => toggleSelectFile(file.id, index, e)}
                      style={{
                        position: "absolute", top: 6, left: 6, zIndex: 12,
                        width: 22, height: 22, borderRadius: 5,
                        background: isChecked ? "#C98484" : "rgba(255,255,255,0.92)",
                        border: isChecked ? "2px solid #C98484" : "2px solid #94a3b8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", transition: "all 0.15s",
                        cursor: "pointer",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                      }}
                      title={isChecked ? "Seçimi Kaldır (Shift+Tık aralık seçer)" : "Seç (Shift+Tık aralık seçer)"}
                    >
                      {isChecked && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>

                    {/* Restore / trash action on bottom-left */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (mediaTab === "trash") restoreFiles([file.id])
                        else handleDelete(file.id)
                      }}
                      style={{
                        position: "absolute", bottom: 6, left: 6, zIndex: 12,
                        width: 26, height: 26, borderRadius: 6,
                        background: mediaTab === "trash" ? "rgba(22, 163, 74, 0.92)" : "rgba(220, 38, 38, 0.9)",
                        border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#ffffff", cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        transition: "all 0.15s ease-in-out",
                        opacity: 0.85,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                      title={mediaTab === "trash" ? "Geri Yükle" : "Çöp Kutusuna Taşı"}
                    >
                      {mediaTab === "trash" ? <RotateCcw size={13} /> : <Trash2 size={13} />}
                    </button>

                    {mediaTab === "trash" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(file.id)
                        }}
                        style={{
                          position: "absolute", bottom: 6, right: 6, zIndex: 12,
                          width: 26, height: 26, borderRadius: 6,
                          background: "rgba(220, 38, 38, 0.92)", border: "none",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        }}
                        title="Kalıcı Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    {/* Image */}
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
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    
                    {/* Subtle Filename Tag at Bottom */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(to top, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0))",
                      padding: "16px 8px 5px 38px",
                      pointerEvents: "none"
                    }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: "#ffffff",
                        textAlign: "right", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {displayName}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // List view
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleSelectAll}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                      title="Tümünü Seç / Seçimi Kaldır"
                    />
                  </th>
                  <th style={{ width: 60 }}>Önizleme</th>
                  <th>Dosya</th>
                  <th>Tarih</th>
                  <th style={{ width: 120 }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((file, index) => {
                  const isChecked = selectedIds.includes(file.id)
                  const displayName = getDisplayName(file)
                  return (
                    <tr
                      key={file.id}
                      style={{ background: isChecked ? "#fcf7f6" : "transparent", cursor: "pointer" }}
                      onClick={() => setLightboxFile(file)}
                    >
                      <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelectFile(file.id, index, e as any)}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                      </td>
                      <td>
                        <img src={file.url} alt={displayName} title={displayName}
                          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #c3c4c7" }} />
                      </td>
                      <td title={displayName}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1d2327", marginBottom: 2 }}>
                          {displayName}
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#646970", wordBreak: "break-all" }}>
                          {file.url}
                        </div>
                      </td>
                      <td style={{ color: "#646970", fontSize: 12, whiteSpace: "nowrap" }}>
                        {file.created_at ? new Date(file.created_at).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {mediaTab === "trash" ? (
                            <button style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #86efac", borderRadius: 4, background: "#f0fdf4", color: "#15803d", cursor: "pointer", fontWeight: 700 }}
                              onClick={() => restoreFiles([file.id])}>Geri Yükle</button>
                          ) : (
                            <button className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}
                              onClick={() => copyUrl(file.url)}>Kopyala</button>
                          )}
                          <button style={{ padding: "4px 8px", fontSize: 11, border: "none", borderRadius: 4, background: "#d63638", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                            onClick={() => handleDelete(file.id)}>{mediaTab === "trash" ? "Kalıcı Sil" : "Çöp Kutusuna Taşı"}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        .media-card-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important;
        }
      `}</style>

      {/* Lightbox Full Screen Preview Modal */}
      {lightboxFile && (
        <div
          onClick={() => setLightboxFile(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(10px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "space-between",
            padding: "24px", boxSizing: "border-box"
          }}
        >
          {/* Lightbox Header */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 1000,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              color: "#ffffff"
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                {getDisplayName(lightboxFile)}
              </h3>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {lightboxFile.created_at ? new Date(lightboxFile.created_at).toLocaleDateString("tr-TR") : "Tarih bilgisi yok"}
              </span>
            </div>

            <button
              onClick={() => setLightboxFile(null)}
              style={{
                background: "rgba(255,255,255,0.12)", border: "none",
                color: "#ffffff", borderRadius: "50%", width: 36, height: 36,
                fontSize: 20, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                transition: "background 0.15s"
              }}
              title="Kapat (ESC)"
            >
              ✕
            </button>
          </div>

          {/* Lightbox Body with Prev/Next Navigation */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1, width: "100%", maxWidth: 1500,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 20, position: "relative"
            }}
          >
            {/* Prev Button */}
            <button
              onClick={() => {
                const idx = filtered.findIndex((f) => f.id === lightboxFile.id)
                if (idx > 0) setLightboxFile(filtered[idx - 1])
              }}
              disabled={filtered.findIndex((f) => f.id === lightboxFile.id) <= 0}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, opacity: filtered.findIndex((f) => f.id === lightboxFile.id) <= 0 ? 0.3 : 1,
                transition: "all 0.15s"
              }}
              title="Önceki Görsel (Sol Ok)"
            >
              ◀
            </button>

            {/* Main Preview Image */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", maxHeight: "72vh", minWidth: 0 }}>
              <img
                src={lightboxFile.url}
                alt={getDisplayName(lightboxFile)}
                style={{
                  maxHeight: "72vh", maxWidth: "100%",
                  objectFit: "contain", borderRadius: 12,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}
              />
            </div>

            {mediaDraft && (
              <aside style={{ width: 390, maxHeight: "72vh", overflowY: "auto", borderRadius: 14, background: "#fff", padding: 20, color: "#0f172a", boxShadow: "0 18px 50px rgba(0,0,0,.35)" }}>
                <h4 style={{ margin: "0 0 4px", fontSize: 16 }}>Görsel ve SEO Bilgileri</h4>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 11, lineHeight: 1.5 }}>
                  Dosya adı değişirse bu görselin veritabanındaki tüm kullanımları güvenli biçimde yeni adrese taşınır.
                </p>
                {[
                  ["Dosya adı", "filename", "SEO uyumlu, kısa ve açıklayıcı yazın."],
                  ["Başlık", "title", "Medya kütüphanesindeki yönetim başlığı."],
                  ["Alternatif metin", "alt_text", "Görsel görünmediğinde ve ekran okuyucularda anlatılacak metin."],
                  ["Altyazı", "caption", "Gerektiğinde görsel altında gösterilecek kısa metin."],
                ].map(([label, key, help]) => (
                  <label key={key} style={{ display: "block", marginBottom: 13 }}>
                    <span style={{ display: "block", marginBottom: 5, fontSize: 11, fontWeight: 800 }}>{label}</span>
                    <input
                      value={mediaDraft[key as keyof MediaDraft]}
                      onChange={(event) => setMediaDraft((current) => current ? { ...current, [key]: event.target.value } : current)}
                      style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 10px", fontSize: 12, boxSizing: "border-box" }}
                    />
                    <span style={{ display: "block", marginTop: 4, color: "#94a3b8", fontSize: 9.5 }}>{help}</span>
                  </label>
                ))}
                <label style={{ display: "block", marginBottom: 13 }}>
                  <span style={{ display: "block", marginBottom: 5, fontSize: 11, fontWeight: 800 }}>Açıklama</span>
                  <textarea
                    rows={4}
                    value={mediaDraft.description}
                    onChange={(event) => setMediaDraft((current) => current ? { ...current, description: event.target.value } : current)}
                    style={{ width: "100%", resize: "vertical", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 10px", fontSize: 12, boxSizing: "border-box" }}
                  />
                </label>
                <label style={{ display: "block", marginBottom: 14 }}>
                  <span style={{ display: "block", marginBottom: 5, fontSize: 11, fontWeight: 800 }}>Dosya adresi</span>
                  <input readOnly value={lightboxFile.url} onFocus={(event) => event.currentTarget.select()} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", padding: "9px 10px", color: "#64748b", fontSize: 10.5, boxSizing: "border-box" }} />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, color: "#64748b", fontSize: 10 }}>
                  <span>Tür: {lightboxFile.mime_type || "—"}</span>
                  <span>Boyut: {lightboxFile.size_bytes ? `${Math.max(1, Math.round(lightboxFile.size_bytes / 1024))} KB` : "—"}</span>
                </div>
                <button
                  type="button"
                  disabled={savingMedia}
                  onClick={saveMediaDetails}
                  style={{ width: "100%", border: 0, borderRadius: 9, padding: "11px 14px", background: savingMedia ? "#fdba74" : "#C98484", color: "#fff", fontSize: 12, fontWeight: 800, cursor: savingMedia ? "wait" : "pointer" }}
                >
                  {savingMedia ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
                </button>
              </aside>
            )}

            {/* Next Button */}
            <button
              onClick={() => {
                const idx = filtered.findIndex((f) => f.id === lightboxFile.id)
                if (idx >= 0 && idx < filtered.length - 1) setLightboxFile(filtered[idx + 1])
              }}
              disabled={filtered.findIndex((f) => f.id === lightboxFile.id) >= filtered.length - 1}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, opacity: filtered.findIndex((f) => f.id === lightboxFile.id) >= filtered.length - 1 ? 0.3 : 1,
                transition: "all 0.15s"
              }}
              title="Sonraki Görsel (Sağ Ok)"
            >
              ▶
            </button>
          </div>

          {/* Lightbox Footer Action Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(30, 41, 59, 0.9)", padding: "10px 20px",
              borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
            }}
          >
            <button
              onClick={() => copyUrl(lightboxFile.url)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: "#ffffff", color: "#0f172a", fontSize: 12,
                fontWeight: 700, cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6
              }}
            >
              📋 Linki Kopyala
            </button>

            <button
              onClick={() => downloadFile(lightboxFile.url, getDisplayName(lightboxFile))}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: "rgba(255,255,255,0.15)", color: "#ffffff", fontSize: 12,
                fontWeight: 700, cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6
              }}
            >
              ⬇️ İndir
            </button>

            {mediaTab === "trash" && (
              <button
                onClick={() => restoreFiles([lightboxFile.id])}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: "#16a34a", color: "#ffffff", fontSize: 12,
                  fontWeight: 700, cursor: "pointer", display: "inline-flex",
                  alignItems: "center", gap: 6
                }}
              >
                <RotateCcw size={14} /> Geri Yükle
              </button>
            )}

            <button
              onClick={() => handleDelete(lightboxFile.id)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: "#d63638", color: "#ffffff", fontSize: 12,
                fontWeight: 700, cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6
              }}
            >
              <Trash2 size={14} /> {mediaTab === "trash" ? "Kalıcı Sil" : "Çöp Kutusuna Taşı"}
            </button>
          </div>
        </div>
      )}

      {/* Single Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title={mediaTab === "trash" ? "Dosyayı Kalıcı Sil" : "Dosyayı Çöp Kutusuna Taşı"}
        message={mediaTab === "trash"
          ? "Bu dosyayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          : "Bu dosya çöp kutusuna taşınacak. Daha sonra Silinenler bölümünden geri yükleyebilirsiniz."}
        confirmText={mediaTab === "trash" ? "Kalıcı Sil" : "Çöp Kutusuna Taşı"}
        cancelText="Vazgeç"
        onConfirm={performSingleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={confirmBulkDelete}
        title={mediaTab === "trash" ? "Dosyaları Kalıcı Sil" : "Dosyaları Çöp Kutusuna Taşı"}
        message={mediaTab === "trash"
          ? `Seçilen ${selectedIds.length} dosyayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
          : `Seçilen ${selectedIds.length} dosya çöp kutusuna taşınacak ve daha sonra geri yüklenebilecek.`}
        confirmText={mediaTab === "trash"
          ? `Evet, ${selectedIds.length} Dosyayı Kalıcı Sil`
          : `${selectedIds.length} Dosyayı Çöp Kutusuna Taşı`}
        cancelText="Vazgeç"
        onConfirm={performBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </div>
  )
}
