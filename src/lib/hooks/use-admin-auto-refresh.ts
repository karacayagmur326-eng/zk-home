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
    let timer: ReturnType<typeof setTimeout>
    let running = false
    const schedule = () => {
      clearTimeout(timer)
      if (!controller.signal.aborted) timer = setTimeout(run, 10_000)
    }
    const run = async () => {
      if (controller.signal.aborted || running) return
      clearTimeout(timer)
      if (document.hidden || navigator.onLine === false) { schedule(); return }
      running = true
      try { await latest.current(controller.signal) } catch {
        // Keep the last successful data during temporary connection failures.
      } finally { running = false; schedule() }
    }
    if (immediate) void run()
    else schedule()
    window.addEventListener("focus", run)
    window.addEventListener("online", run)
    window.addEventListener("admin-notifications:refresh", run)
    document.addEventListener("visibilitychange", run)
    return () => {
      controller.abort()
      clearTimeout(timer)
      window.removeEventListener("focus", run)
      window.removeEventListener("online", run)
      window.removeEventListener("admin-notifications:refresh", run)
      document.removeEventListener("visibilitychange", run)
    }
  }, [enabled, refreshKey, immediate])
}
