"use client"

import { useState } from "react"

type ReturnableItem = {
  id: string
  title: string
  quantity: number
  thumbnail?: string | null
  variant_title?: string | null
}

export default function ReturnRequest({
  orderId,
  items,
}: {
  orderId: string
  items: ReturnableItem[]
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(formData: FormData) {
    const selectedItems = items
      .map((item) => ({
        order_item_id: item.id,
        quantity: Number(formData.get(`quantity_${item.id}`) || 0),
      }))
      .filter((item) => item.quantity > 0)
    if (!selectedItems.length) {
      setMessage("İade etmek istediğiniz en az bir ürün ve adet seçin.")
      return
    }
    setSubmitting(true)
    setMessage("")
    try {
      const response = await fetch("/api/account/returns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          reason: formData.get("reason"),
          note: formData.get("note"),
          items: selectedItems,
        }),
      })
      const data = await response.json()
      setMessage(
        response.ok
          ? "İade talebiniz ürün ve adet bilgileriyle alındı."
          : data.error || "İade talebi oluşturulamadı."
      )
      if (response.ok) setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="iade-talebi" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold">İade talebi</h2>
          <p className="text-sm text-gray-600">Teslimattan itibaren 14 gün içinde talep oluşturabilirsiniz.</p>
        </div>
        <button onClick={() => setOpen((value) => !value)} className="rounded-lg border border-[#C98484] px-4 py-2 text-sm font-bold text-[#C98484]">
          İade talebi oluştur
        </button>
      </div>
      {open && (
        <form action={submit} className="mt-4 space-y-3">
          <fieldset className="space-y-2 rounded-lg border border-gray-200 p-3">
            <legend className="px-1 text-sm font-bold">
              İade edilecek ürünler
            </legend>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-gray-100 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  {item.variant_title && item.variant_title !== "Standart" ? (
                    <p className="text-xs text-gray-500">
                      {item.variant_title}
                    </p>
                  ) : null}
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm">
                  Adet
                  <select
                    name={`quantity_${item.id}`}
                    defaultValue="0"
                    className="rounded-md border border-gray-300 px-2 py-1.5"
                    aria-label={`${item.title} iade adedi`}
                  >
                    {Array.from(
                      { length: Number(item.quantity) + 1 },
                      (_, index) => (
                        <option key={index} value={index}>
                          {index}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>
            ))}
          </fieldset>
          <select name="reason" required className="w-full rounded-lg border p-3">
            <option value="">İade nedeni seçin</option>
            <option value="Vazgeçtim">Vazgeçtim</option>
            <option value="Hasarlı ürün">Ürün hasarlı geldi</option>
            <option value="Yanlış ürün">Yanlış ürün gönderildi</option>
            <option value="Diğer">Diğer</option>
          </select>
          <textarea name="note" rows={3} className="w-full rounded-lg border p-3" placeholder="Açıklama (isteğe bağlı)" />
          <button
            disabled={submitting}
            className="rounded-lg bg-[#C98484] px-5 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Gönderiliyor..." : "Talebi gönder"}
          </button>
        </form>
      )}
      {message && <p className="mt-3 text-sm font-semibold">{message}</p>}
    </section>
  )
}
