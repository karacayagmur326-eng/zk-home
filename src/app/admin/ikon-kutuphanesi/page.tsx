"use client"
import React, { useState } from "react"
import {
  APP_ICON_OPTIONS as SELECTABLE_ICONS,
  Building2,
  Package,
  Search,
  Wrench,
} from "@lib/icons"

export default function IconLibraryPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<"all" | "hirdavat" | "magaza" | "kurumsal">("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredIcons = SELECTABLE_ICONS.filter(item => {
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase()) || item.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCat && matchesSearch
  })

  function copyCode(name: string) {
    navigator.clipboard.writeText(name)
    setCopied(name)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 23, fontWeight: 700, color: "#172033", display: "flex", alignItems: "center", gap: 10 }}>
            <span className="admin-section-icon"><Wrench aria-hidden="true" size={18} /></span>
            Kurumsal İkon Kütüphanesi
          </h2>
          <p style={{ margin: "4px 0 0", color: "#646970", fontSize: 13 }}>
            Sitede, kategorilerde, sliderlarda ve menülerde kullanabileceğiniz kurumsal SVG ikon seti.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: "#fff", border: "1px solid #c3c4c7", borderRadius: 6, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setCategoryFilter("all")}
            className={`admin-btn ${categoryFilter === "all" ? "admin-btn-primary" : "admin-btn-secondary"}`}
          >
            Tümü ({SELECTABLE_ICONS.length})
          </button>
          <button
            onClick={() => setCategoryFilter("hirdavat")}
            className={`admin-btn ${categoryFilter === "hirdavat" ? "admin-btn-primary" : "admin-btn-secondary"}`}
          >
            <Wrench aria-hidden="true" size={15} /> Hırdavat ve Aletler
          </button>
          <button
            onClick={() => setCategoryFilter("magaza")}
            className={`admin-btn ${categoryFilter === "magaza" ? "admin-btn-primary" : "admin-btn-secondary"}`}
          >
            <Package aria-hidden="true" size={15} /> Mağaza ve Kargo
          </button>
          <button
            onClick={() => setCategoryFilter("kurumsal")}
            className={`admin-btn ${categoryFilter === "kurumsal" ? "admin-btn-primary" : "admin-btn-secondary"}`}
          >
            <Building2 aria-hidden="true" size={15} /> Kurumsal
          </button>
        </div>

        <div style={{ position: "relative", width: 240 }}>
          <Search aria-hidden="true" size={16} style={{ position: "absolute", left: 11, top: 12, color: "#98a2b3" }} />
          <input
            type="text"
            className="admin-input"
            placeholder="İkon ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Grid of Icons */}
      <div style={{ background: "#fff", border: "1px solid #c3c4c7", borderRadius: 6, padding: 20 }}>
        {filteredIcons.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#646970", fontSize: 14 }}>
            Aramanızla eşleşen ikon bulunamadı.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
            {filteredIcons.map((item) => (
              <div
                key={item.name}
                onClick={() => copyCode(item.name)}
                style={{
                  border: "1px solid #e2e8f0", borderRadius: 8, padding: 16,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", background: "#fafafa", transition: "all 0.2s ease"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#C98484"; e.currentTarget.style.background = "#fff" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 8, background: "#fff", border: "1px solid #edf2f7", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", marginBottom: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1d2327", textAlign: "center", marginBottom: 2 }}>{item.label}</span>
                <span style={{ fontSize: 10, color: "#646970", fontFamily: "Inter, sans-serif" }}>
                  {copied === item.name ? "✓ Kopyalandı" : item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
