import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sipariş İşlemleri",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
