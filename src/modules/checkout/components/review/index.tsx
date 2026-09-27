"use client"

import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import PaymentButton from "../payment-button"
import LegalContractsModal from "../legal-contracts-modal"
import { Heading, Text, clx } from "@modules/common/components/ui"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [activeLegalModal, setActiveLegalModal] = useState<"on-bilgilendirme" | "mesafeli-satis" | null>(null)
  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard = Boolean(
    (cart as unknown as Record<string, unknown>)?.gift_cards &&
      ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])
        ?.length > 0 &&
      cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="mb-6 flex flex-row items-center justify-between">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row items-baseline gap-x-2 text-3xl-regular",
            { "pointer-events-none select-none opacity-50": !isOpen }
          )}
        >
          Sipariş Onayı
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#C98484]"
            />
            <Text className="text-sm leading-6 text-ui-fg-base">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setActiveLegalModal("on-bilgilendirme")
                }}
                className="font-bold text-[#C98484] underline hover:text-rose-700 cursor-pointer inline"
              >
                Ön Bilgilendirme Formu
              </button>
              ’nu ve{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setActiveLegalModal("mesafeli-satis")
                }}
                className="font-bold text-[#C98484] underline hover:text-rose-700 cursor-pointer inline"
              >
                Mesafeli Satış Sözleşmesi
              </button>
              ’ni okudum ve kabul ediyorum. Siparişin ödeme yükümlülüğü
              doğurduğunu biliyorum.
            </Text>
          </label>
          <PaymentButton
            cart={cart}
            termsAccepted={termsAccepted}
            data-testid="submit-order-button"
          />

          {/* Dynamic Legal Contracts Modal */}
          <LegalContractsModal
            cart={cart}
            activeModal={activeLegalModal}
            onClose={() => setActiveLegalModal(null)}
          />
        </>
      )}
    </div>
  )
}

export default Review
