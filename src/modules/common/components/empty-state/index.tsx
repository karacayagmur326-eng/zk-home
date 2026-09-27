import { Inbox } from "@lib/icons"
import clsx from "clsx"
import { ReactNode } from "react"

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex min-h-56 flex-col items-center justify-center rounded-rounded border border-dashed border-border bg-subtle/60 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-circle bg-muted/10 text-muted">
        {icon ?? <Inbox aria-hidden="true" className="h-6 w-6" />}
      </div>
      <h3 className="text-ui-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-ui-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
