"use server"

import { retrieveCart } from "./cart"

async function getOptions(cartId: string) {
  const cart = await retrieveCart(cartId)
  const subtotal = Number(cart?.subtotal || 0)
  const FREE_THRESHOLD = 250000 // 2500 TL
  const free = subtotal >= FREE_THRESHOLD

  return [
    {
      id: "shipping_standard",
      name: "Standart Kargo",
      amount: free ? 0 : 9900,
      price_type: "flat",
      service_zone: { fulfillment_set: { type: "shipping" } },
    },
  ]
}

export const listCartShippingMethods = async (cartId: string) => {
  return await getOptions(cartId)
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  _data?: Record<string, unknown>
) => {
  const options = await getOptions(cartId)
  return options.find(o => o.id === optionId) || null
}
