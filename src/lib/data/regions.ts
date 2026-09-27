"use server"

import { HttpTypes } from "@medusajs/types"
import { stripeEnabled } from "@lib/payments/stripe"

const TURKEY_REGION = {
  id: "region_tr",
  name: "Türkiye",
  currency_code: "try",
  automatic_taxes: false,
  countries: [
    {
      iso_2: "tr",
      iso_3: "tur",
      num_code: "792",
      name: "TÜRKİYE",
      display_name: "Türkiye",
      region_id: "region_tr",
    },
  ],
  payment_providers: [
    ...(stripeEnabled() ? [{ id: "pp_stripe_stripe" }] : []),
    { id: "pp_system_default" },
  ],
} as unknown as HttpTypes.StoreRegion

export const listRegions = async () => [TURKEY_REGION]

export const retrieveRegion = async (id: string) =>
  id === TURKEY_REGION.id ? TURKEY_REGION : null

export const getRegion = async (_countryCode: string) => TURKEY_REGION
