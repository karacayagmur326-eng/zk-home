type OrderJourneyProps = {
  stage: "pending" | "preparing" | "shipped" | "delivered"
  compact?: boolean
  localDelivery?: boolean
}

const steps = [
  { key: "pending", title: "Sipariş Alındı", detail: "Ödeme Onaylandı", icon: "check" },
  { key: "preparing", title: "Hazırlanıyor", detail: "Paketleniyor", icon: "package" },
  { key: "shipped", title: "Kargoya Verildi", detail: "Kargo Yolda", icon: "truck" },
  { key: "delivered", title: "Teslim Edildi", detail: "Teslimat Tamamlandı", icon: "home" },
] as const

const stageIndex = { pending: 0, preparing: 1, shipped: 2, delivered: 3 }

function StepIcon({ icon, completed }: { icon: string; completed: boolean }) {
  if (completed || icon === "check") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
  }
  if (icon === "package") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7.5 8-4 8 4-8 4-8-4Zm0 0v9l8 4 8-4v-9M12 11.5v9" /></svg>
  }
  if (icon === "truck") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3V6Zm11 4h4l3 3v4h-7v-7ZM8 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-7 9 7v9h-6v-6H9v6H3v-9Z" /></svg>
}

export default function OrderJourney({ stage, compact = false, localDelivery = false }: OrderJourneyProps) {
  const journeySteps = steps.map(step => step.key === "shipped" && localDelivery ? { ...step, title: "ZK Home Teslimat", detail: "Teslimat Planlandı" } : step)
  const current = stageIndex[stage]
  const progress = current === 3 ? 100 : current === 2 ? 67 : current === 1 ? 34 : 0

  return (
    <div className={`order-journey ${compact ? "order-journey--compact" : ""}`} aria-label={`Sipariş durumu: ${journeySteps[current].title}`}>
      <div className="order-journey__rail" aria-hidden="true">
        <span className="order-journey__progress" style={{ width: `${progress}%` }} />
        {stage === "shipped" && <span className="order-journey__traveller"><StepIcon icon="truck" completed={false} /></span>}
      </div>
      {journeySteps.map((step, index) => {
        const reached = index <= current
        const completed = index < current || current === 3
        const active = index === current && current < 3
        return (
          <div className="order-journey__step" key={step.key}>
            <span className={`order-journey__node ${reached ? "is-reached" : ""} ${active ? "is-active" : ""}`}>
              <StepIcon icon={step.icon} completed={completed} />
            </span>
            <strong className={reached ? "is-reached" : ""}>{step.title}</strong>
            {!compact && <small>{completed && step.key === "preparing" ? "Paketlendi" : step.detail}</small>}
          </div>
        )
      })}
    </div>
  )
}
