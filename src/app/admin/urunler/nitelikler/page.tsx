"use client"
import React from "react"
import { SlidersHorizontal } from "@lib/icons"

export default function AttributesPlaceholderPage() {
  return (
    <div className="admin-content-stack">
      <div>
        <h2 className="admin-section-title">Özellikler</h2>
        <p className="admin-section-description">Ürün özelliklerini ve varyant seçeneklerini yönetin.</p>
      </div>

      <div className="admin-panel admin-empty-state">
        <div className="admin-section-icon" style={{ width: 48, height: 48, flexBasis: 48 }}>
          <SlidersHorizontal aria-hidden="true" size={22} />
        </div>
        <h3>Özellik & Varyasyon Yönetimi</h3>
        <p className="admin-section-description">
          Renk, boyut, malzeme ve ürüne özel diğer bilgiler ürün ekleme/düzenleme ekranında tanımlanabilir.
        </p>
      </div>
    </div>
  )
}
