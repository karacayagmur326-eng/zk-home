import type { ReactNode } from "react"

export default function ProductOverview({ gallery, children }: { gallery: ReactNode; children: ReactNode }) {
  return <div className="product-overview space-y-3 sm:space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:gap-8 lg:space-y-0 lg:pb-6">
    <div className="min-w-0">{gallery}</div>
    <div className="product-overview-details min-w-0 flex flex-col">{children}</div>
  </div>
}
