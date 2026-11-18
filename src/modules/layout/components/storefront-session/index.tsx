"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { cartMutationVersion, hydrateCartState, useCartState } from "@lib/util/cart-state"
import FavoriteAccountSync from "@modules/account/components/favorite-account-sync"
import AdminQuickEditBar from "../admin-quick-edit-bar"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

type Session = {
  admin: boolean
  maintenanceBypass: boolean
  onboarding: boolean
  customer: { id: string; first_name?: string | null; last_name?: string | null; role?: string } | null
  shippingOptions: HttpTypes.StoreCartShippingOption[]
}
const empty: Session = { admin: false, maintenanceBypass: false, onboarding: false, customer: null, shippingOptions: [] }
const Context = createContext<Session>(empty)
export const useStorefrontSession = () => useContext(Context)

// Account layout already reads its private session. Notify the persistent
// storefront shell after a same-URL login/logout Server Action refresh.
export function StorefrontSessionSync({ identity }: { identity: string }) {
  useEffect(() => { window.dispatchEvent(new Event("storefront_session_changed")) }, [identity])
  return null
}

export default function StorefrontSession({ children, maintenance }: { children: ReactNode; maintenance?: ReactNode }) {
  const [session, setSession] = useState(empty)
  const [revision, setRevision] = useState(0)
  const loadedAt = useRef(0)
  const previousPath = useRef("")
  const pathname = usePathname()
  const { cart } = useCartState()
  useEffect(() => {
    const refresh = () => { loadedAt.current = 0; setRevision(value => value + 1) }
    window.addEventListener("storefront_session_changed", refresh)
    return () => window.removeEventListener("storefront_session_changed", refresh)
  }, [])
  useEffect(() => {
    // Keep a single private snapshot while browsing; recheck after account changes.
    const accountChanged = [pathname, previousPath.current].some(path => /^\/(hesabim|admin)(\/|$)/.test(path))
    previousPath.current = pathname
    if (loadedAt.current && Date.now() - loadedAt.current < 60_000 && !accountChanged) return
    const controller = new AbortController()
    const version = cartMutationVersion()
    fetch("/api/storefront/session", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Session unavailable"); return response.json() })
      .then(data => {
        if (controller.signal.aborted) return
        hydrateCartState(data.cart, version)
        setSession({ admin: data.admin === true, maintenanceBypass: data.maintenanceBypass === true, onboarding: data.onboarding === true, customer: data.customer, shippingOptions: data.shippingOptions || [] })
        loadedAt.current = Date.now()
      }).catch(() => {})
    return () => controller.abort()
  }, [pathname, revision])
  return <Context.Provider value={session}>
    {maintenance && !session.maintenanceBypass ? maintenance : children}
    <FavoriteAccountSync enabled={Boolean(session.customer)} />
    {cart && <FreeShippingPriceNudge variant="popup" cart={cart} shippingOptions={session.shippingOptions} />}
    {session.admin && <AdminQuickEditBar />}
  </Context.Provider>
}
