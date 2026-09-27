"use client"

import { Suspense } from "react"
import { useFormState as useActionState } from "react-dom"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetCustomerPassword } from "@lib/data/customer"

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || ""
  const [state, action, pending] = useActionState(resetCustomerPassword, {
    success: false,
    error: null as string | null,
  })
  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8">
      <h1 className="mb-6 text-2xl font-bold">Yeni şifre belirleyin</h1>
      {state.success ? (
        <>
          <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">Şifreniz yenilendi.</p>
          <Link href="/hesabim" className="mt-5 inline-block font-semibold text-[#C98484]">Giriş yap</Link>
        </>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <label className="block text-sm font-semibold">Yeni şifre
            <input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <label className="block text-sm font-semibold">Yeni şifre (tekrar)
            <input name="confirmation" type="password" minLength={8} required className="mt-1 w-full rounded-lg border p-3" />
          </label>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button disabled={pending || !token} className="w-full rounded-lg bg-[#C98484] p-3 font-bold text-white disabled:opacity-50">
            {pending ? "Kaydediliyor…" : "Şifreyi yenile"}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="content-container py-16">
      <Suspense fallback={<div className="text-center py-12 text-sm text-slate-500">Yükleniyor...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}

