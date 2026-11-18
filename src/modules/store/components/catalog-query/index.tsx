"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

const empty = { pathname: "/magaza", searchParams: new URLSearchParams() }
const Context = createContext(empty)

/** The server owns catalog filters. Sharing its snapshot preserves complete
 * SSR markup without making an unfiltered page depend on request cookies/URL. */
export default function CatalogQueryProvider({ pathname, query, children }: { pathname: string; query: string; children: ReactNode }) {
  const value = useMemo(() => ({ pathname, searchParams: new URLSearchParams(query) }), [pathname, query])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export const useCatalogQuery = () => useContext(Context)
