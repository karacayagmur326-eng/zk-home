"use client"
import { useEffect, useState } from "react"

export function enableSiteMotion() {
  try { sessionStorage.setItem("zkhome-motion", "on") } catch {}
  document.documentElement.dataset.siteMotion = "on"
  window.dispatchEvent(new Event("zkhome_motion_enabled"))
}

export default function useMotionEnabled() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => {
      let optedIn = false
      try { optedIn = sessionStorage.getItem("zkhome-motion") === "on" } catch {}
      if (optedIn) document.documentElement.dataset.siteMotion = "on"
      setEnabled(optedIn || !media.matches)
    }
    update()
    if (media.addEventListener) media.addEventListener("change", update)
    else media.addListener(update)
    window.addEventListener("zkhome_motion_enabled", update)
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update)
      else media.removeListener(update)
      window.removeEventListener("zkhome_motion_enabled", update)
    }
  }, [])
  return enabled
}
