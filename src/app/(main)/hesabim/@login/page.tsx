import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Müşteri hesabınıza giriş yapın.",
  robots: { index: false, follow: false },
}

export default function Login() {
  return <LoginTemplate />
}
