"use client"

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react"
import { usePathname } from "next/navigation"

/** Keep non-sensitive page selections in the URL across reloads and history. */
export function useUrlState<T extends string>(initial: T, key: string, allowed?: readonly string[], writeToUrl = true) {
  const pathname = usePathname()
  const [value, setValue] = useState<T>(initial)
  const current = useRef(value)
  const allowedKey = allowed?.join("\0")
  useEffect(() => {
    const restore = () => {
      const selected = new URL(window.location.href).searchParams.get(key)
      const choices = allowedKey?.split("\0")
      const next = selected !== null && (!choices || choices.includes(selected)) ? selected as T : initial
      current.current = next
      setValue(next)
    }
    restore()
    window.addEventListener("popstate", restore)
    return () => window.removeEventListener("popstate", restore)
  }, [pathname, key, initial, allowedKey])
  const select = useCallback((update: SetStateAction<T>) => {
    const next = typeof update === "function" ? update(current.current) : update
    current.current = next
    setValue(next)
    if (!writeToUrl) return
    const url = new URL(window.location.href)
    url.searchParams.set(key, next)
    window.history.replaceState(window.history.state, "", url)
  }, [key, writeToUrl])
  return [value, select] as const
}
