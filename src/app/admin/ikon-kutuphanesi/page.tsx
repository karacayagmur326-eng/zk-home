"use client"
import { AdminSectionHeading } from "@components/admin/AdminContent"
import AdminTabs from "@components/admin/AdminTabs"
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
      <AdminSectionHeading title="Kurumsal İkon Kütüphanesi" description="Sitede, kategorilerde, sliderlarda ve menülerde kullanabileceğiniz kurumsal SVG ikon seti." icon={<Wrench size={18} aria-hidden="true" />} />

      {/* Filter and Search Bar */}
      <div className="admin-card admin-content-toolbar">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <AdminTabs label="İkon kategorileri"
            value={categoryFilter}
            onChange={setCategoryFilter}
            items={[{ value: "all", label: "Tümü", count: SELECTABLE_ICONS.length }, { value: "hirdavat", label: "Hırdavat & Aletler" }, { value: "magaza", label: "Mağaza & Kargo" }, { value: "kurumsal", label: "Kurumsal" }]}/>
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
      <div className="admin-card">
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
