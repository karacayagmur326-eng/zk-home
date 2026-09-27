"use client"

import { useFormState as useActionState } from "react-dom"
import Link from "next/link"
import { requestPasswordReset } from "@lib/data/customer"

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, {
    success: false,
    error: null as string | null,
  })
  return (
    <main className="content-container py-16">
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8">
        <h1 className="mb-2 text-2xl font-bold">Şifremi unuttum</h1>
        <p className="mb-6 text-sm text-gray-600">
          Hesabınıza kayıtlı e-posta adresini girin.
        </p>
        {state.success ? (
          <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Hesap bulunursa şifre yenileme bağlantısı e-posta adresinize gönderildi.
          </p>
        ) : (
          <form action={action} className="space-y-4">
            <label className="block text-sm font-semibold">
              E-posta
              <input name="email" type="email" required className="mt-1 w-full rounded-lg border p-3" />
            </label>
            <button disabled={pending} className="w-full rounded-lg bg-[#C98484] p-3 font-bold text-white">
              {pending ? "Gönderiliyor…" : "Bağlantı gönder"}
            </button>
          </form>
        )}
        <Link href="/hesabim" className="mt-5 inline-block text-sm font-semibold text-[#C98484]">
          Giriş ekranına dön
        </Link>
      </div>
    </main>
  )
}
