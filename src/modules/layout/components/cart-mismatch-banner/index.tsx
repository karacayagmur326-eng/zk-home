"use client"

import { transferCart } from "@lib/data/customer"
import { ExclamationCircleSolid } from "@lib/icons"
import { StoreCart, StoreCustomer } from "@medusajs/types"
import { useState } from "react"

function CartMismatchBanner(props: {
  customer: StoreCustomer
  cart: StoreCart
}) {
  const { customer, cart } = props
  const [isPending, setIsPending] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [actionText, setActionText] = useState("Sepetimi Hesabıma Aktar")

  // Hide banner if no customer, no cart, or if cart already belongs to this customer
  if (!customer || !cart || cart.customer_id === customer.id) {
    return null
  }

  const handleSubmit = async () => {
    try {
      setIsPending(true)
      setActionText("Aktarılıyor...")
      setHasError(false)

      await transferCart()
    } catch {
      setActionText("Tekrar Deneyin")
      setHasError(true)
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-3 text-center bg-amber-50 border-b border-amber-200 text-xs font-semibold text-amber-900 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <span className="flex items-center gap-2 font-medium">
          <ExclamationCircleSolid className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            {hasError
              ? "Sepetiniz hesabınıza aktarılırken bir sorun oluştu."
              : "Misafir sepetinizdeki ürünleri hesabınıza aktarabilirsiniz."}
          </span>
        </span>

        <span className="hidden sm:inline text-amber-300">•</span>

        <button
          type="button"
          disabled={isPending}
          onClick={handleSubmit}
          className="font-extrabold text-[#C98484] hover:text-rose-700 underline underline-offset-2 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {actionText}
        </button>
      </div>
    </div>
  )
}

export default CartMismatchBanner
