"use client"

import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRef, useState } from "react"
import { useFormState as useActionState } from "react-dom"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserPlus, ArrowRight, Headphones, Loader2 } from "@lib/icons"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction, isPending] = useActionState(login, null)
  const [showPassword, setShowPassword] = useState(false)
  const guestFavoritesRef = useRef<HTMLInputElement>(null)

  const prepareGuestData = () => {
    if (!guestFavoritesRef.current) return
    guestFavoritesRef.current.value =
      window.localStorage.getItem("zkhome:favorites") || "[]"
  }

  return (
    <div className="w-full space-y-6" data-testid="login-page">
      {message?.state === "verification_required" && (
        <div
          className="w-full rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-slate-700"
          data-testid="login-verification-message"
        >
          <strong>{message.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
          Lütfen e-postanızı doğrulayın, ardından giriş yapın.
        </div>
      )}

      <form
        action={formAction}
        onSubmit={prepareGuestData}
        className="w-full space-y-4"
      >
        <input
          ref={guestFavoritesRef}
          type="hidden"
          name="guest_favorites"
          defaultValue="[]"
        />
        {/* E-posta */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Kullanıcı adı veya e-posta
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              name="email"
              required
              autoComplete="username"
              maxLength={254}
              aria-label="Kullanıcı adı veya e-posta"
              placeholder="Kullanıcı adınız veya e-posta adresiniz"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white focus:ring-2 focus:ring-[#C98484]/15 transition-all"
              data-testid="email-input"
            />
          </div>
        </div>

        {/* Şifre */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Şifre
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              autoComplete="current-password"
              placeholder="Şifrenizi giriniz"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white focus:ring-2 focus:ring-[#C98484]/15 transition-all"
              data-testid="password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Checkbox and Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] accent-[#C98484]"
            />
            <span>Beni hatırla</span>
          </label>

          <Link
            href="/sifremi-unuttum"
            className="text-xs font-bold text-[#C98484] hover:text-rose-700 transition-colors"
          >
            Şifremi unuttum
          </Link>
        </div>

        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />

        {/* Primary Login Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          data-testid="sign-in-button"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Giriş Yap</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative bg-white px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          veya
        </span>
      </div>

      {/* Subtext and Register Button */}
      <div className="space-y-3 text-center">
        <p className="text-xs font-medium text-slate-500">
          Üye değil misiniz? Hemen hesap oluşturun.
        </p>

        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="w-full h-12 rounded-xl border border-[#C98484] text-[#C98484] hover:bg-rose-50/50 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          data-testid="register-button"
        >
          <span>Üye Ol</span>
          <UserPlus className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom Trust Badge Ribbon */}
      <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5 grid grid-cols-3 gap-2 text-center mt-6">
        <div className="flex flex-col items-center gap-1">
          <Lock className="h-4 w-4 text-[#C98484]" />
          <span className="text-[10px] font-bold text-slate-800">Şifreli Bağlantı</span>
          <span className="text-[9px] text-slate-400">Güncel TLS bağlantısı</span>
        </div>

        <div className="flex flex-col items-center gap-1 border-x border-slate-200/60 px-1">
          <ShieldCheck className="h-4 w-4 text-[#C98484]" />
          <span className="text-[10px] font-bold text-slate-800">Gizlilik Odaklı</span>
          <span className="text-[9px] text-slate-400">Kişisel verileriniz korunur</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Headphones className="h-4 w-4 text-[#C98484]" />
          <span className="text-[10px] font-bold text-slate-800">Müşteri Desteği</span>
          <span className="text-[9px] text-slate-400">Çalışma saatlerinde</span>
        </div>
      </div>
    </div>
  )
}

export default Login
