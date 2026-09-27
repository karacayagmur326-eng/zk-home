import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import { listCartPaymentMethods } from "@lib/data/payment"
import { listCartOptions } from "@lib/data/cart"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  const paymentMethods = await listCartPaymentMethods(cart?.region_id || "region_tr")
  const { shipping_options: shippingOptions } = await listCartOptions(cart?.id)
  return (
    <div className="w-full">
      <Addresses
        cart={cart}
        customer={customer}
        paymentMethods={paymentMethods}
        shippingOptions={shippingOptions}
      />
    </div>
  )
}
