import { retrieveCart, getOrSetCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { ShieldCheck, RotateCcw, Headphones } from "@lib/icons"
import EcommerceEvent from "@components/common/EcommerceEvent"

export const metadata: Metadata = {
  title: "Güvenli Ödeme",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function Checkout() {
  let cart = await retrieveCart().catch(() => null)
  if (!cart) {
    cart = await getOrSetCart("tr").catch(() => null)
  }
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-8 sm:pb-12">
      {cart?.items?.length ? <EcommerceEvent event="begin_checkout" once={`checkout:${cart.id}:${cart.total}`} data={{ currency: String(cart.currency_code || "TRY").toUpperCase(), value: Number(cart.item_total ?? cart.subtotal ?? 0) / 100, items: cart.items.map(item => ({ item_id: item.variant_id, item_name: item.title, price: Number(item.unit_price) / 100, quantity: item.quantity })) }} /> : null}
      <div className="content-container mx-auto max-sm:px-0 grid grid-cols-1 gap-4 sm:gap-8 py-3 sm:py-8 lg:grid-cols-[1fr_420px] lg:py-12">
        <div className="order-2 min-w-0 lg:order-1">
          <PaymentWrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </PaymentWrapper>
        </div>
        <div className="order-1 min-w-0 lg:order-2 lg:self-start">
          <CheckoutSummary cart={cart} />
        </div>
      </div>

      {/* Trust Badges placed at the very bottom of the page */}
      <div className="content-container mx-auto max-sm:px-0 mt-2 sm:mt-6">
        <div className="rounded-none sm:rounded-3xl border-x-0 sm:border border-y border-slate-200/80 sm:border-slate-100 bg-white p-3.5 sm:p-5 shadow-none sm:shadow-soft grid grid-cols-3 gap-2 text-center text-[10.5px]">
          <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#C98484] mb-1" />
            <span className="font-bold text-slate-900 block leading-tight">Güvenli Alışveriş</span>
            <span className="text-[9.5px] sm:text-xs font-medium text-slate-400 block mt-0.5">Ödeme kuruluşu güvencesi</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80">
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-[#C98484] mb-1" />
            <span className="font-bold text-slate-900 block leading-tight">Kolay İade</span>
            <span className="text-[9.5px] sm:text-xs font-medium text-slate-400 block mt-0.5">14 gün içinde iade</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80">
            <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-[#C98484] mb-1" />
            <span className="font-bold text-slate-900 block leading-tight">Hızlı Destek</span>
            <span className="text-[9.5px] sm:text-xs font-medium text-slate-400 block mt-0.5">Çalışma saatlerinde destek</span>
          </div>
        </div>
      </div>
    </div>
  )
}
