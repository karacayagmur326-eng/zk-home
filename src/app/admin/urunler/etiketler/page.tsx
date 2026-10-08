"use client"
import { AdminSectionHeading } from "@components/admin/AdminContent"
import { useEffect, useState } from "react"
import ConfirmModal from "../../components/ConfirmModal"

interface Tag { id: string; value: string }

function slugifyTag(val: string): string {
  let str = val.trim().toLowerCase()
  const charMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
  }
  str = str.replace(/[çğıiöşüÇĞIİÖŞÜ]/g, (match) => charMap[match] || match)
  str = str.replace(/^[#\s'"]+/, '')
  str = str
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return str
}

export default function TagsPage() {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [newTag, setNewTag] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function fetchTags() {
    setLoading(true)
    fetch("/api/admin/product-tags")
      .then(r => r.json())
      .then(d => { setTags(d.tags || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchTags() }, [])

  const filtered = tags.filter(t => t.value.toLowerCase().includes(search.toLowerCase()))
  const seoPreview = newTag
    ? newTag
        .split(/[,;\r\n]+/)
        .map((part) => slugifyTag(part))
        .filter(Boolean)
        .map((tag) => `#${tag}`)
        .join(", ")
    : ""

  async function handleAddTag() {
    const val = newTag.trim()
    if (!val) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/product-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: val })
      })
      const responseText = await res.text()
      let data: any = {}
      if (responseText) {
        try {
          data = JSON.parse(responseText)
        } catch {
          data = { error: `Sunucu geçersiz yanıt döndürdü (${res.status}).` }
        }
      } else {
        data = { error: `Sunucu boş yanıt döndürdü (${res.status}).` }
      }
      if (!res.ok) { setError(data.error || "Bir hata oluştu"); setSaving(false); return }
      setNewTag("")
      fetchTags()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteTag(id: string) {
    setConfirmDeleteId(id)
  }

  async function performDelete() {
    if (!confirmDeleteId) return
    try {
      const res = await fetch(`/api/admin/product-tags/${confirmDeleteId}`, { method: "DELETE" })
      if (res.ok) {
        setTags(prev => prev.filter(t => t.id !== confirmDeleteId))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <AdminSectionHeading title="Ürün Etiketleri" />
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#646970" }}>
            Tüm etiketler Google SEO standartlarına göre otomatik küçük harf, Türkçe karaktersiz ve tireli (slug) olarak kaydedilir.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Left add tag form */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Yeni Etiket Ekle</span>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {error && <div style={{ padding: "8px 12px", background: "#fce8e8", color: "#d63638", borderRadius: 6, fontSize: 12 }}>{error}</div>}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Etiket Adı</label>
                <input 
                  value={newTag} onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag() } }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, outline: "none" }} 
                  placeholder="Örn: şarjlı matkap, akülü matkap"
                />
                {seoPreview && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#16a34a", background: "#f0fdf4", padding: "6px 10px", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                    🔍 <strong>Google SEO Formatı:</strong> {seoPreview}
                  </div>
                )}
              </div>

              <button 
                className="admin-btn admin-btn-primary" 
                style={{ width: "100%", justifyContent: "center", padding: "9px 16px", borderRadius: 8, fontWeight: 700, background: "#C98484", border: "none", color: "#fff" }} 
                onClick={handleAddTag} 
                disabled={saving || !newTag.trim()}
              >
                {saving ? "Kaydediliyor..." : "Etiketleri Ekle"}
              </button>
              
              <div style={{ marginTop: 6, paddingTop: 14, borderTop: "1px solid #f1f5f9", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                <strong style={{ fontSize: 12, color: "#475569" }}>Toplam Etiket: </strong>
                <span style={{ color: "#C98484", fontWeight: 800, fontSize: 13 }}>{tags.length} adet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right tag list with remove buttons */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <input className="admin-input" style={{ width: 240, padding: "7px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} placeholder="Etiket ara..." value={search} onChange={e => setSearch(e.target.value)} />
            <span style={{ color: "#646970", fontSize: 12, fontWeight: 600 }}>{filtered.length} öge listeleniyor</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            {loading ? (
              <div style={{ padding: 30, textAlign: "center", color: "#646970", fontSize: 13 }}>Yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "#646970", fontSize: 13 }}>Etiket bulunamadı.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {filtered.map(t => (
                  <span key={t.id} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 999, fontSize: 12, fontWeight: 700, color: "#334155"
                  }}>
                    #{t.value}
                    <button 
                      onClick={() => handleDeleteTag(t.id)} 
                      title="Bu etiketi sil"
                      style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "0 0 0 2px", fontWeight: 900, fontSize: 15, lineHeight: 1 }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Etiketi Sil"
        message="Bu etiketi veritabanından silmek istediğinizden emin misiniz?"
        onConfirm={performDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
