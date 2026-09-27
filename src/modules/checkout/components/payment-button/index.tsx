"use client"

import { isStripeLike } from "@lib/constants"
import {
  acceptCheckoutTerms,
  initiatePaymentSession,
  placeOrder,
} from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  termsAccepted?: boolean
  providerId?: string
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  termsAccepted = false,
  providerId,
  "data-testid": dataTestId,
}) => {
  const notReady = !cart || !termsAccepted || !providerId

  const paymentSession = cart?.payment_collection?.payment_sessions?.[0]

  if (isStripeLike(providerId)) {
    return (
      <StripePaymentButton
        cart={cart}
        notReady={notReady}
        data-testid={dataTestId}
      />
    )
  }

  return (
    <ConfiguredPaymentButton
      cart={cart}
      providerId={providerId || ""}
      notReady={notReady}
      data-testid={dataTestId}
    />
  )
}

const ConfiguredPaymentButton = ({
  cart,
  providerId,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  providerId: string
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      await acceptCheckoutTerms(cart.id)
      const activeProvider =
        cart.payment_collection?.payment_sessions?.[0]?.provider_id
      if (
        providerId === "pp_iyzico_iyzico" ||
        activeProvider !== providerId
      ) {
        const result = await initiatePaymentSession(cart, {
          provider_id: providerId,
        })
        if (result.payment_url) {
          window.location.assign(result.payment_url)
          return
        }
      }
      await placeOrder()
    } catch (err: any) {
      setErrorMessage(err.message || "Ödeme işlemi tamamlanırken bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        className="w-full bg-[#C98484] hover:bg-rose-600 font-extrabold text-white"
        data-testid={dataTestId || "submit-order-button"}
      >
        {providerId === "bank_transfer"
          ? "Siparişi Oluştur"
          : providerId === "cash_on_delivery"
            ? "Kapıda Ödeme ile Siparişi Tamamla"
            : "Öde ve Siparişi Tamamla"}
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="payment-error-message"
      />
    </>
  )
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >Siparişi Tamamla</Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
