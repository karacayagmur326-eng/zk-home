"use client"

import React, { useState } from "react"
import { Shield, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

export default function AdminLoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, otp }),
      })
      const data = await response.json()
      setLoading(false)

      if (!response.ok) {
        return setError(data.error || "Giriş başarısız.")
      }

      window.location.href = "/admin"
      onSuccess?.()
    } catch {
      setLoading(false)
      setError("Sunucuya bağlanırken bir hata oluştu.")
    }
  }

  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C98484]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Login Card matching user screenshot */}
      <div className="w-full max-w-md bg-[#111625]/95 backdrop-blur-xl border border-rose-500/25 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-rose-500/10 relative z-10 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          {/* Glowing Shield Icon */}
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20 text-[#C98484] mb-3">
            <Shield className="h-8 w-8 stroke-[2.2]" />
          </div>

          <div className="text-[#C98484] font-black text-xl tracking-[0.15em] uppercase">
            E-TİCARET
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Yönetim Paneli
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Yönetici hesabınızla giriş yapın
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={submit} className="space-y-4 text-xs font-bold text-slate-300">
          {/* Username Field */}
          <div>
            <label className="block mb-1.5 text-slate-300">Kullanıcı Adı</label>
            <div className="relative">
              <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullaniciadi"
                style={{ paddingLeft: "42px" }}
                className="w-full h-11 bg-[#181f33] border border-slate-700/80 rounded-xl pr-4 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/20 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block mb-1.5 text-slate-300">Şifre</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                style={{ paddingLeft: "42px", paddingRight: "115px" }}
                className="w-full h-11 bg-[#181f33] border border-slate-700/80 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/20 transition-all"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowPassword((prev) => !prev)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 cursor-pointer select-none border border-slate-700/60"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-rose-400" />
                    <span className="text-rose-300">Gizle</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Şifreyi göster</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-slate-300" htmlFor="admin-otp">
              Doğrulama Kodu
            </label>
            <input
              id="admin-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              pattern="[0-9]{6}"
              maxLength={6}
              aria-describedby="admin-otp-help"
              className="w-full h-11 bg-[#181f33] border border-slate-700/80 rounded-xl px-4 text-center tracking-[0.45em] text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/20 transition-all"
            />
            <p id="admin-otp-help" className="mt-1.5 text-[11px] text-slate-500">
              Kimlik doğrulama uygulamanızdaki 6 haneli kod.
            </p>
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 accent-[#C98484] h-4 w-4 cursor-pointer"
              />
              <span>Beni hatırla</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotPasswordModalOpen(true)}
              className="text-[#C98484] hover:underline underline-offset-2 transition-all font-extrabold cursor-pointer"
            >
              Şifremi unuttum
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-black text-sm tracking-wide shadow-lg shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        {/* Bottom Security Footer */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Güvenli bağlantı ile korunmaktadır</span>
          </div>
        </div>
      </div>

      {/* Modern Forgot Password Modal */}
      {forgotPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111625] border border-rose-500/30 text-white rounded-3xl p-7 max-w-sm w-full shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setForgotPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base font-bold w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#C98484]/15 border border-[#C98484]/30 flex items-center justify-center text-[#C98484]">
              <Shield className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white tracking-tight">Şifre Sıfırlama</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Şifre sıfırlama talebiniz ve yeni şifre oluşturma işlemleri için lütfen sistem yöneticiniz ile iletişime geçin.
              </p>
            </div>

            <div className="p-3.5 bg-[#181f33] rounded-2xl border border-slate-700/60 text-xs space-y-2 text-slate-300">
              <div className="font-extrabold text-[#C98484] text-[10px] uppercase tracking-wider">İletişim Kanalı</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Yetkili:</span>
                <span className="text-white font-bold">Sistem Yöneticisi</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-700/40 pt-1.5">
                <span className="text-slate-400 font-medium">Erişim:</span>
                <span className="text-slate-300 font-medium">Veritabanı / Sunucu Paneli</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setForgotPasswordModalOpen(false)}
              className="w-full py-3 bg-[#C98484] hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition cursor-pointer"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
