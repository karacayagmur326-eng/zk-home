"use client"

import { ChevronLeft, ChevronRight } from "@lib/icons"
import clsx from "clsx"

type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  siblingCount?: number
  className?: string
}

const getPages = (page: number, pageCount: number, siblingCount: number) => {
  const start = Math.max(1, page - siblingCount)
  const end = Math.min(pageCount, page + siblingCount)
  const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = []

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push("ellipsis-start")
  }

  for (let current = start; current <= end; current += 1) pages.push(current)

  if (end < pageCount) {
    if (end < pageCount - 1) pages.push("ellipsis-end")
    pages.push(pageCount)
  }

  return pages
}

export default function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null
  const pages = getPages(page, pageCount, siblingCount)

  return (
    <nav
      aria-label="Sayfalama"
      className={clsx("flex items-center justify-center gap-1", className)}
    >
      <button
        type="button"
        aria-label="Önceki sayfa"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-base border border-border bg-card text-foreground hover:bg-subtle disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>
      {pages.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-label={`${item}. sayfa`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={clsx(
              "inline-flex h-10 min-w-10 items-center justify-center rounded-base px-3 text-ui-sm font-medium",
              item === page
                ? "bg-primary text-on-primary"
                : "border border-border bg-card text-foreground hover:bg-subtle",
            )}
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden="true" className="px-2 text-muted">
            …
          </span>
        ),
      )}
      <button
        type="button"
        aria-label="Sonraki sayfa"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-base border border-border bg-card text-foreground hover:bg-subtle disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  )
}
