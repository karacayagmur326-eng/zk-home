import EmptyState from "@modules/common/components/empty-state"
import clsx from "clsx"
import { ReactNode } from "react"

export type DataTableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: "left" | "center" | "right"
  className?: string
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  caption?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  className?: string
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  caption,
  emptyTitle = "Kayıt bulunamadı",
  emptyDescription,
  emptyAction,
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    )
  }

  return (
    <div
      className={clsx(
        "overflow-x-auto rounded-rounded border border-border bg-card",
        className,
      )}
    >
      <table className="w-full border-collapse text-ui-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-subtle text-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={clsx(
                  "border-b border-border px-4 py-3 font-semibold",
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right",
                  (!column.align || column.align === "left") && "text-left",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              className="transition-colors hover:bg-subtle/70"
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={clsx(
                    "px-4 py-3 text-foreground",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
