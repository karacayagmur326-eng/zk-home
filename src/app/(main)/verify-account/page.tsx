import { Metadata } from "next"
import { Suspense } from "react"

import VerifyAccount from "@modules/account/components/verify-account"

export const metadata: Metadata = {
  title: "E-posta Adresini Doğrula",
  description: "Üyeliğinizi tamamlamak için e-posta adresinizi doğrulayın.",
  robots: { index: false, follow: false },
}

export default function VerifyAccountPage() {
  return (
    <div className="w-full flex justify-center px-8 py-12">
      <Suspense
        fallback={
          <p className="text-base-regular text-ui-fg-base">
            E-posta adresiniz doğrulanıyor...
          </p>
        }
      >
        <VerifyAccount />
      </Suspense>
    </div>
  )
}
