"use client"

import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

import { useEffect, useState } from "react"

type ReturnRequest = {
  id: string
  display_id: number
  email: string
  reason: string
  note?: string
  status: string
  admin_note?: string
  created_at: string
}

const labels: Record<string, string> = {
  requested: "Talep edildi",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  received: "Ürün ulaştı",
  refunded: "İade tamamlandı",
}

export default function ReturnsAdminPage() {
  const [requests, setRequests] = useState<ReturnRequest[]>([])
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const load = async (signal?: AbortSignal) => {
    const response = await fetch("/api/admin/returns", { cache: "no-store", signal })
    if (!response.ok) return
    const data = await response.json()
    if (!signal?.aborted) setRequests(data.requests || [])
  }
  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [])
  useAdminAutoRefresh(load, { enabled: !saving })

  async function update(id: string, status: string) {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      setMessage(response.ok ? "İade talebi güncellendi." : "İşlem başarısız.")
      if (response.ok) await load()
    } catch { setMessage("İşlem başarısız. Lütfen tekrar deneyin.") }
    finally { setSaving(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: 23, fontWeight: 400, marginTop: 0 }}>İade Talepleri</h2>
      {message && <div className="admin-notice" style={{ marginBottom: 12 }}>{message}</div>}
      <div style={{ background: "#fff", border: "1px solid #c3c4c7" }}>
        {requests.length === 0 ? <p style={{ padding: 30 }}>Henüz iade talebi yok.</p> : (
          <table className="admin-table">
            <thead><tr><th>Sipariş</th><th>Müşteri</th><th>Neden</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr></thead>
            <tbody>{requests.map((item) => (
              <tr key={item.id}>
                <td>#{String(item.display_id || 0).padStart(4, "0")}</td><td>{item.email}</td>
                <td><strong>{item.reason}</strong>{item.note && <small style={{ display: "block" }}>{item.note}</small>}</td>
                <td>{labels[item.status] || item.status}</td>
                <td>{new Date(item.created_at).toLocaleDateString("tr-TR")}</td>
                <td>
                  <select disabled={saving} value={item.status} onChange={(e) => void update(item.id, e.target.value)}>
                    {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
