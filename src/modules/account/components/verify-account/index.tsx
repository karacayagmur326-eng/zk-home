"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@modules/common/components/ui"
import { confirmEmailVerification } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type VerificationState = "verifying" | "success" | "error"

const VerifyAccount = () => {
  const token = useSearchParams().get("token")
  const [state, setState] = useState<VerificationState>("verifying")
  const confirmed = useRef(false)

  useEffect(() => {
    if (confirmed.current) return
    confirmed.current = true
    if (!token) {
      setState("error")
      return
    }
    confirmEmailVerification(token).then(({ success }) =>
      setState(success ? "success" : "error")
    )
  }, [token])

  return (
    <div className="max-w-sm w-full flex flex-col items-center text-center gap-y-4">
      <h1 className="text-large-semi uppercase">E-posta doğrulama</h1>
      {state === "verifying" && <p>E-posta adresiniz doğrulanıyor…</p>}
      {state === "success" && (
        <>
          <p>E-posta adresiniz doğrulandı. Artık hesabınıza giriş yapabilirsiniz.</p>
          <LocalizedClientLink href="/hesabim">
            <Button variant="primary">Giriş yap</Button>
          </LocalizedClientLink>
        </>
      )}
      {state === "error" && (
        <>
          <p>Doğrulama bağlantısı geçersiz veya süresi dolmuş.</p>
          <LocalizedClientLink href="/hesabim">
            <Button variant="secondary">Giriş ekranına dön</Button>
          </LocalizedClientLink>
        </>
      )}
    </div>
  )
}

export default VerifyAccount
