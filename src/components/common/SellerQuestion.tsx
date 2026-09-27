"use client"

import dynamic from "next/dynamic"
import { X } from "lucide-react"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

// Keep the form code out of the initial storefront download.
const MasterContactForm = dynamic(() => import("./MasterContactForm"), {
  ssr: false,
  loading: () => (
    <div role="status" className="rounded-3xl bg-white p-10 text-sm text-slate-600">
      Form yükleniyor…
    </div>
  ),
})

export type SellerQuestionContextData = {
  name?: string
  email?: string
  phone?: string
  orderNo?: string
  subject?: string
}

type SellerQuestionSettings = {
  formTitle: string
  formDescription: string
  kvkkUrl: string
  companyName: string
  brandName: string
  email: string
  phone: string
  phoneRaw: string
  address: string
  website: string
  taxOffice: string
  taxNumber: string
  mersisNo: string
  tradeRegNo: string
  kepAddress: string
}

type SellerQuestionContextValue = {
  open: (data?: SellerQuestionContextData) => void
  setPageContext: (data: SellerQuestionContextData | null) => void
  settings: SellerQuestionSettings
}

const SellerQuestionContext = createContext<SellerQuestionContextValue | null>(null)

export function SellerQuestionProvider({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: SellerQuestionSettings
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [pageContext, setPageContext] = useState<SellerQuestionContextData | null>(null)
  const [requestContext, setRequestContext] = useState<SellerQuestionContextData | null>(null)

  const open = useCallback((data?: SellerQuestionContextData) => {
    setRequestContext(data || null)
    setIsOpen(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [isOpen])

  const formContext = { ...(pageContext || {}), ...(requestContext || {}) }
  const contextValue = useMemo(
    () => ({ open, setPageContext, settings }),
    [open, settings]
  )

  return (
    <SellerQuestionContext.Provider value={contextValue}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Satıcıya soru sor"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false)
          }}
        >
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Satıcıya soru formunu kapat"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <MasterContactForm
              key={`${formContext.orderNo || "general"}-${String(isOpen)}`}
              formTitle={settings.formTitle || "Satıcıya Sor"}
              formDescription={
                settings.formDescription ||
                "Sorunuzu iletin; ekibimiz en kısa sürede sizinle iletişime geçsin."
              }
              kvkkUrl={settings.kvkkUrl || "/kvkk"}
              defaultSubject={formContext.subject || "Genel Bilgi & Danışma"}
              initialName={formContext.name || ""}
              initialEmail={formContext.email || ""}
              initialPhone={formContext.phone || ""}
              initialOrderNo={formContext.orderNo || ""}
              className="shadow-none"
            />
          </div>
        </div>
      )}
    </SellerQuestionContext.Provider>
  )
}

export function useSellerQuestion() {
  const context = useContext(SellerQuestionContext)
  if (!context) {
    throw new Error("useSellerQuestion must be used inside SellerQuestionProvider")
  }
  return context
}

export function useSiteContact() {
  return useSellerQuestion().settings
}

export function SellerQuestionButton({
  children,
  className,
  context,
  onClick,
  title,
}: {
  children: React.ReactNode
  className?: string
  context?: SellerQuestionContextData
  onClick?: () => void
  title?: string
}) {
  const { open } = useSellerQuestion()
  return (
    <button
      type="button"
      className={className}
      title={title}
      onClick={() => {
        onClick?.()
        open(context)
      }}
    >
      {children}
    </button>
  )
}

export function SellerQuestionPageContext({
  value,
}: {
  value: SellerQuestionContextData
}) {
  const { setPageContext } = useSellerQuestion()
  const serialized = JSON.stringify(value)

  useEffect(() => {
    setPageContext(value)
    return () => setPageContext(null)
    // JSON serialization keeps this effect stable for equivalent order data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, setPageContext])

  return null
}
