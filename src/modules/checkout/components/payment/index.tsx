"use client"

import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard, Banknote, Landmark } from "@lib/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Container,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? "pp_iyzico_iyzico"
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards &&
    ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 &&
    cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) ||
    paidByGiftcard ||
    Boolean(selectedPaymentMethod)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!activeSession || activeSession.provider_id !== selectedPaymentMethod) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }
      return router.push(
        pathname + "?" + createQueryString("step", "review"),
        { scroll: false }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const PAYMENT_OPTIONS = [
    {
      id: "pp_iyzico_iyzico",
      label: "Kredi / Banka Kartı (iyzico)",
      desc: "iyzico ile paranız güvende! Tüm kartlarla peşin veya taksitli güvenli online ödeme yapabilirsiniz.",
      badge: (
        <div className="flex items-center gap-1.5 bg-[#0066CC] px-2.5 py-1 rounded-lg">
          <span className="text-white text-[11px] font-black tracking-wider">iyzico</span>
          <span className="text-white/80 text-[9px] font-medium">ile Öde</span>
        </div>
      ),
      icon: <CreditCard className="w-4 h-4 text-blue-600" />,
    },
    {
      id: "bank_transfer",
      label: "Havale / EFT ile Öde",
      desc: "Siparişinizi verdikten sonra banka hesabımıza havale veya EFT yapabilirsiniz.",
      badge: (
        <span className="text-[11px] font-extrabold text-[#C98484] bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
          Banka Havalesi
        </span>
      ),
      icon: <Landmark className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: "cash_on_delivery",
      label: "Kapıda Ödeme",
      desc: "Ödemenizi siparişiniz teslim edilirken kapıda nakit veya kartla yapabilirsiniz.",
      badge: null,
      icon: <Banknote className="w-4 h-4 text-amber-600" />,
    },
  ]

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Ödeme
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Düzenle
            </button>
          </Text>
        )}
      </div>

      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && (
            <div className="space-y-4">
              {PAYMENT_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedPaymentMethod(opt.id)}
                  className={clx(
                    "p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3",
                    selectedPaymentMethod === opt.id
                      ? "border-[#C98484] bg-rose-50/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_option"
                        checked={selectedPaymentMethod === opt.id}
                        onChange={() => setSelectedPaymentMethod(opt.id)}
                        className="h-4 w-4 accent-[#C98484]"
                      />
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        {opt.icon}
                        {opt.label}
                      </span>
                    </div>
                    {opt.badge}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-7">
                    {opt.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Ödeme yöntemi
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Hediye kartı
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!selectedPaymentMethod && !paidByGiftcard}
            data-testid="submit-payment-button"
          >
            Sipariş Özetine Geç
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Ödeme yöntemi
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {selectedPaymentMethod === "bank_transfer"
                    ? "Havale / EFT"
                    : selectedPaymentMethod === "cash_on_delivery"
                    ? "Kapıda Ödeme"
                    : "Kredi / Banka Kartı (iyzico)"}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Ödeme ayrıntıları
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    <CreditCard />
                  </Container>
                  <Text>
                    {selectedPaymentMethod === "bank_transfer"
                      ? "Banka Havalesi"
                      : selectedPaymentMethod === "cash_on_delivery"
                      ? "Kapıda Nakit/Kart"
                      : "iyzico Korumalı Ödeme"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Ödeme yöntemi
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Hediye kartı
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
