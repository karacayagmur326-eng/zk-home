"use server"

import { getCommerceSettings } from "@lib/commerce/settings"
import { iyzicoEnabled } from "@lib/payments/iyzico"

export type CheckoutPaymentMethod = {
  id: string
  label: string
  description: string
}

export const listCartPaymentMethods = async (
  _regionId: string
): Promise<CheckoutPaymentMethod[]> => {
  const settings = await getCommerceSettings()
  const methods: CheckoutPaymentMethod[] = []

  const isIyzicoActive = await iyzicoEnabled()
  const creditCardAllowed =
    settings.payment_methods.creditCard ||
    isIyzicoActive ||
    Boolean(settings.payment_methods_list?.find((m) => m.id === "card")?.active)

  if (creditCardAllowed && isIyzicoActive) {
    methods.push({
      id: "pp_iyzico_iyzico",
      label: "iyzico ile Güvenli Ödeme",
      description:
        "Kart bilgileriniz mağaza sunucusunda tutulmadan iyzico güvenli ödeme sayfasında işlenir.",
    })
  }

  const transferAccount = settings.bank_accounts.some(
    (account) =>
      account.active &&
      account.showInCheckout &&
      Boolean(account.iban) &&
      Boolean(account.accountHolder)
  )
  if (settings.payment_methods.bankTransfer && transferAccount) {
    methods.push({
      id: "bank_transfer",
      label: "Havale / EFT",
      description: "Siparişiniz ödeme doğrulanana kadar ödeme bekliyor durumunda tutulur.",
    })
  }

  if (settings.payment_methods.cashOnDelivery) {
    methods.push({
      id: "cash_on_delivery",
      label: "Kapıda Ödeme",
      description: "Ödeme, sipariş teslim edilirken tahsil edilir.",
    })
  }

  return methods
}
