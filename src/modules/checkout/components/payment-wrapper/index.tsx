"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripeLike } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart | null
  children: React.ReactNode
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const stripeAccountId = process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    )
  : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart?.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  if (
    isStripeLike(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper
