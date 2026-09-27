"use client"

import { useState } from "react"
import {
  Sparkles,
  Users,
  Coins,
  CheckCircle2,
  Sliders,
  Info,
} from "@lib/icons"

export default function LoyaltyProgramPage() {
  const [enabled, setEnabled] = useState(true)
  const [pointsPerTl, setPointsPerTl] = useState("1")
  const [tlPerPoint, setTlPerPoint] = useState("0.05")
  const [minRedeem, setMinRedeem] = useState("100")
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="w-full space-y-6 pb-12 font-sans text-slate-800">
      {/* Header Controls */}
      <div className="flex justify-end items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">{enabled ? "Program Aktif" : "Pasif"}</span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C98484]"></div>
          </label>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Sadakat programı ayarları başarıyla kaydedildi!</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-[#C98484]" />
            <h3 className="text-sm font-black text-slate-900">Puan Kazanım Oranı</h3>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Harcanan Her 1 TL İçin Kazanılacak Puan</label>
            <div className="relative">
              <input
                type="number"
                value={pointsPerTl}
                onChange={(e) => setPointsPerTl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-black outline-none focus:border-[#C98484]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Puan</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Örn: 100 TL alışveriş yapan müşteri 100 puan kazanır.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Coins className="w-4 h-4 text-[#C98484]" />
            <h3 className="text-sm font-black text-slate-900">Puan Kullanım Değeri</h3>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">1 Puanın TL Karşılığı</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={tlPerPoint}
                onChange={(e) => setTlPerPoint(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-black outline-none focus:border-[#C98484]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">TL</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Örn: 100 Puan = {Number(pointsPerTl) * 100 * Number(tlPerPoint)} TL indirim sağlar.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-[#C98484]" />
            <h3 className="text-sm font-black text-slate-900">Minimum Kullanım Eşiği</h3>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">En Az Kullanılabilir Puan Limiti</label>
            <div className="relative">
              <input
                type="number"
                value={minRedeem}
                onChange={(e) => setMinRedeem(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-black outline-none focus:border-[#C98484]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Puan</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Müşteri puan harcamak için en az bu puana ulaşmalıdır.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
        >
          Sadakat Ayarlarını Kaydet
        </button>
      </div>
    </div>
  )
}
