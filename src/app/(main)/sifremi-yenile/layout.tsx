import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Şifre Yenileme",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
