"use client"

import {
  CircleAlert,
  CircleCheck,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from "@lib/icons"
import clsx from "clsx"
import FeedbackPopup from "@modules/common/components/feedback-popup"
import { CART_WARNING_EVENT } from "@lib/util/cart-feedback"
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "block animate-pulse rounded-base bg-muted/20",
        className
      )}
    />
  )
}

export function LoadingState({
  label = "Yükleniyor...",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        "flex min-h-32 items-center justify-center gap-3 text-ui-sm text-muted",
        className
      )}
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-5 w-5 animate-spin text-primary"
      />
      <span>{label}</span>
    </div>
  )
}

export function FormError({
  message,
  className,
  "data-testid": dataTestId,
}: {
  message?: string | null
  className?: string
  "data-testid"?: string
}) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={clsx(
        "flex items-start gap-1.5 py-2 text-small-regular text-danger",
        className
      )}
      data-testid={dataTestId}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export type AlertVariant = "info" | "success" | "warning" | "danger"

const alertConfig = {
  info: {
    icon: Info,
    iconBg: "bg-rose-100 text-[#C98484]",
    cardBorder: "border-rose-200/80",
  },
  success: {
    icon: CircleCheck,
    iconBg: "bg-emerald-100 text-emerald-600",
    cardBorder: "border-emerald-200/80",
  },
  warning: {
    icon: TriangleAlert,
    iconBg: "bg-amber-100 text-amber-600",
    cardBorder: "border-amber-200/80",
  },
  danger: {
    icon: CircleAlert,
    iconBg: "bg-rose-100 text-rose-600",
    cardBorder: "border-rose-200/80",
  },
}

export function Alert({
  title,
  description,
  variant = "info",
  action,
  className,
}: {
  title: string
  description?: string
  variant?: AlertVariant
  action?: ReactNode
  className?: string
}) {
  const config = alertConfig[variant]
  const Icon = config.icon
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={clsx(
        "flex gap-3 rounded-2xl border bg-white p-4 text-slate-800 shadow-soft",
        config.cardBorder,
        className
      )}
    >
      <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold", config.iconBg)}>
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-900">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs font-medium text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

type ToastInput = {
  title: string
  description?: string
  variant?: AlertVariant
  duration?: number
  isFavoriteToast?: boolean
}

type ToastItem = ToastInput & { id: number }

type ToastContextValue = {
  toast: (input: ToastInput) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [cartWarning, setCartWarning] = useState("")
  useEffect(() => {
    const warn = (event: Event) => setCartWarning(String((event as CustomEvent).detail?.message || ""))
    window.addEventListener(CART_WARNING_EVENT, warn)
    return () => window.removeEventListener(CART_WARNING_EVENT, warn)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setToasts((current) => [
        ...current,
        { variant: "success", duration: 4500, ...input, id },
      ])
      window.setTimeout(() => dismiss(id), input.duration ?? 4500)
      return id
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <FeedbackPopup message={cartWarning} title="Sepet uyarısı" onClose={() => setCartWarning("")} />
      <div
        role="region"
        aria-label="Bildirimler"
        className="pointer-events-none fixed right-4 top-4 z-[200] flex flex-col items-end gap-3 max-w-md w-full px-2 sm:px-0"
      >
        {toasts.map((item) => {
          if (item.isFavoriteToast) {
            return (
              <div
                key={item.id}
                role="status"
                className="pointer-events-auto w-full max-w-[400px] rounded-[22px] border border-slate-100 bg-white p-5 text-slate-900 shadow-2xl shadow-slate-900/12 transition-all animate-in slide-in-from-top-4 fade-in duration-250"
              >
                {/* Header Row */}
                <div className="flex items-start gap-4">
                  {/* Heart Badge with Sparkles */}
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0E6]">
                      <svg
                        className="h-7 w-7 text-[#C98484]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                        />
                      </svg>
                      {/* Check badge */}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#C98484] text-white shadow-xs">
                        <svg
                          className="h-3 w-3 stroke-[3]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </span>
                    </div>

                    {/* Sparkle top left */}
                    <span className="absolute -left-1.5 -top-1 text-xs text-[#C98484]/80 pointer-events-none select-none">
                      ✦
                    </span>
                    {/* Sparkle bottom right */}
                    <span className="absolute -bottom-1 -right-2 text-xs text-[#C98484]/80 pointer-events-none select-none">
                      ✦
                    </span>
                  </div>

                  {/* Title & Product Name */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h4 className="text-base font-bold text-slate-900 leading-tight mb-1">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs font-semibold text-slate-600 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => dismiss(item.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <X aria-hidden="true" className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Footer Link */}
                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center">
                  <a
                    href="/hesabim/favorilerim"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#C98484] hover:text-[#d84f00] transition-colors"
                  >
                    <span>Favorileri Gör</span>
                    <svg
                      className="h-3.5 w-3.5 stroke-[2.5]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            )
          }

          const config = alertConfig[item.variant ?? "success"]
          const Icon = config.icon
          return (
            <div
              key={item.id}
              role={item.variant === "danger" ? "alert" : "status"}
              className={clsx(
                "pointer-events-auto flex w-full items-start gap-3.5 rounded-2xl border bg-white/95 backdrop-blur-md p-4 text-slate-900 shadow-xl shadow-slate-900/10 transition-all animate-in slide-in-from-top-3 fade-in duration-200",
                config.cardBorder
              )}
            >
              <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-2xs", config.iconBg)}>
                <Icon aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-1 text-[11px] font-semibold text-slate-600 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                aria-label="Bildirimi kapat"
                onClick={() => dismiss(item.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context)
    throw new Error("useToast, ToastProvider içinde kullanılmalıdır.")
  return context
}
