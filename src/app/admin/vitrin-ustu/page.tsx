"use client"
import { useState, useEffect } from "react"

type Category = {
  id: string
  name: string
  handle: string
  parent_category_id: string | null
}

export default function VitrinUstuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then(r => r.json()),
      fetch("/api/admin/homepage-categories").then(r => r.json()),
    ]).then(([catData, hpData]) => {
      const cats: Category[] = (catData.categories || []).filter((c: Category) => !c.parent_category_id)
      setCategories(cats)
      setSelectedIds(hpData.category_ids || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/homepage-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_ids: selectedIds }),
      })
      const data = await res.json()
      if (data.success) {
        ;(window as any).showAdminAlert?.(`${data.count} kategori vitrin üstüne kaydedildi.`, "Başarılı", "success")
      } else {
        ;(window as any).showAdminAlert?.(data.error || "Bir hata oluştu.", "Hata", "error")
      }
    } catch {
      ;(window as any).showAdminAlert?.("Bağlantı hatası.", "Hata", "error")
    } finally {
      setSaving(false)
    }
  }

  const C = {
    white: "#ffffff",
    border: "#c3c4c7",
    muted: "#646970",
    primary: "#C98484",
    primaryLight: "#fcf7f6",
    heading: "#1d2327",
    rowHover: "#f6f7f7",
  }

  const filtered = categories.filter(c =>
    c.name.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR"))
  )

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header card */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.heading }}>
            Ana Sayfa Vitrin Üstü Kategorileri
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
            Seçilen kategoriler ana sayfanın üst bölümündeki dairesel kategori şeridinde gösterilir.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          style={{
            background: saving ? "#ccc" : C.primary,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "9px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {saving ? "Kaydediliyor..." : `Kaydet (${selectedIds.length} seçili)`}
        </button>
      </div>

      {/* Selected count banner */}
      {selectedIds.length > 0 && (
        <div
          style={{
            background: C.primaryLight,
            border: `1px solid #fed7aa`,
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: C.primary,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>✓</span>
          <span>{selectedIds.length} kategori seçili — bunlar vitrin üstünde gösterilecek.</span>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Kategori ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category list */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 160px",
            padding: "10px 16px",
            background: "#f6f7f7",
            borderBottom: `1px solid ${C.border}`,
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span></span>
          <span>Kategori</span>
          <span>Slug</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Kategori bulunamadı.</div>
        ) : (
          filtered.map((cat, i) => {
            const isSelected = selectedIds.includes(cat.id)
            return (
              <div
                key={cat.id}
                onClick={() => toggle(cat.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 160px",
                  padding: "11px 16px",
                  borderBottom: i < filtered.length - 1 ? `1px solid #f0f0f1` : "none",
                  cursor: "pointer",
                  background: isSelected ? "#fcf7f6" : "transparent",
                  alignItems: "center",
                  transition: "background 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(cat.id)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 16, height: 16, accentColor: C.primary, cursor: "pointer" }}
                />
                <span
                  style={{
                    fontWeight: isSelected ? 700 : 400,
                    color: isSelected ? C.primary : C.heading,
                    fontSize: 14,
                  }}
                >
                  {cat.name}
                </span>
                <span style={{ fontSize: 12, color: C.muted }}>{cat.handle}</span>
              </div>
            )
          })
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
        * İşaretlediğiniz kategoriler ana sayfanın vitrin üstü dairesel şeridinde sırasıyla listelenecektir.
      </p>
    </div>
  )
}
