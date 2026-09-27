import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ürün Karşılaştırma",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
