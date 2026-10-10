"use client"
import { useEffect } from "react"
import { trackEcommerce } from "@lib/analytics/ecommerce"

export default function EcommerceEvent({
  event,
  data,
  once,
}: {
  event: "view_item" | "begin_checkout" | "purchase"
  data: Record<string, any>
  once?: string
}) {
  useEffect(() => {
    let sent = false
    const send = () => {
      if (!sent) sent = trackEcommerce(event, data, once)
    }
    send()
    window.addEventListener("zk-analytics-ready", send)
    return () => window.removeEventListener("zk-analytics-ready", send)
  }, [event, JSON.stringify(data), once])
  return null
}
