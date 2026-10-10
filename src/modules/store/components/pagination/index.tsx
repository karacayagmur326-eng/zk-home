"use client"

import PaginationControl from "@modules/common/components/pagination"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function Pagination({
  page,
  totalPages,
  "data-testid": dataTestid,
}: {
  page: number
  totalPages: number
  "data-testid"?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
  }

  return (
    <div className="block mt-6 sm:mt-12 py-3 px-2" data-testid={dataTestid}>
      <PaginationControl
        page={page}
        pageCount={totalPages}
        onPageChange={handlePageChange}
        getPageHref={(target) => {
          const params = new URLSearchParams(searchParams.toString())
          if (target === 1) params.delete("page")
          else params.set("page", String(target))
          return `${pathname}${params.size ? `?${params}` : ""}`
        }}
      />
    </div>
  )
}
