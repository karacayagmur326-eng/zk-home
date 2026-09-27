"use client"
import React from "react"
import { SlidersHorizontal } from "@lib/icons"

export default function AttributesPlaceholderPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 8 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1d2327" }}>Özellikler</h2>
        <p style={{ margin: "4px 0 0", color: "#646970", fontSize: 14 }}>Ürün özelliklerini ve varyant seçeneklerini yönetin.</p>
      </div>

      <div style={{
        background: "#fff", border: "1px solid #c3c4c7", borderRadius: 8,
        padding: "48px 24px", textAlign: "center", color: "#646970", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16
      }}>
        <div className="admin-section-icon" style={{ width: 48, height: 48, flexBasis: 48 }}>
          <SlidersHorizontal aria-hidden="true" size={22} />
        </div>
        <h3 style={{ margin: 0, color: "#1d2327", fontSize: 16, fontWeight: 600 }}>Özellik & Varyasyon Yönetimi</h3>
        <p style={{ margin: 0, maxWidth: 460, fontSize: 14, lineHeight: 1.6, color: "#646970" }}>
          Renk, boyut, malzeme ve ürüne özel diğer bilgiler ürün ekleme/düzenleme ekranında tanımlanabilir.
        </p>
      </div>
    </div>
  )
}
