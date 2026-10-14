"use client"

import { useEffect, useRef } from "react"

/** Refresh data without remounting forms or allowing overlapping background requests. */
export function useAdminAutoRefresh(
  refresh: (signal: AbortSignal) => Promise<unknown>,
  { enabled = true, refreshKey = "", immediate = false }: {
    enabled?: boolean
    refreshKey?: string
    immediate?: boolean
  } = {},
) {
  const latest = useRef(refresh)
  useEffect(() => { latest.current = refresh }, [refresh])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let running = false
    let lastRefresh = immediate ? 0 : Date.now()
    const run = async (event?: Event) => {
      if (controller.signal.aborted || running) return
      if (document.hidden || navigator.onLine === false) return
      const forced = event?.type === "admin-notifications:refresh"
      if (!forced && Date.now() - lastRefresh < 60_000) return
      lastRefresh = Date.now()
      running = true
      try { await latest.current(controller.signal) } catch {
        // Keep the last successful data during temporary connection failures.
      } finally { running = false }
    }
    if (immediate) void run()
    window.addEventListener("focus", run)
    window.addEventListener("online", run)
    window.addEventListener("admin-notifications:refresh", run)
    document.addEventListener("visibilitychange", run)
    return () => {
      controller.abort()
      window.removeEventListener("focus", run)
      window.removeEventListener("online", run)
      window.removeEventListener("admin-notifications:refresh", run)
      document.removeEventListener("visibilitychange", run)
    }
  }, [enabled, refreshKey, immediate])
}
