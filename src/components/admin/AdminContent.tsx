import type { ReactNode } from "react"

/** Shared content typography and surfaces for admin pages. */
export function AdminSectionHeading({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return <div className="admin-section-heading">
    <h2 className="admin-section-title">{icon && <span className="admin-section-icon">{icon}</span>}{title}</h2>
    {description && <p className="admin-section-description">{description}</p>}
  </div>
}

export function AdminMetric({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: string; icon: ReactNode }) {
  return <section className="admin-card admin-metric">
    <div><p className="admin-section-description">{label}</p><strong className="admin-metric-value">{value}</strong>{detail && <p className="admin-section-description">{detail}</p>}</div>
    <span className="admin-section-icon">{icon}</span>
  </section>
}

export function AdminEmptyState({ title, description, icon }: { title: string; description?: string; icon: ReactNode }) {
  return <div className="admin-empty-state"><span className="admin-section-icon">{icon}</span><h3>{title}</h3>{description && <p className="admin-section-description">{description}</p>}</div>
}
