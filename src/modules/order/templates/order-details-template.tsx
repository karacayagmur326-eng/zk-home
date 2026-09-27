"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import React from "react"
import ReturnRequest from "@modules/order/components/return-request"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="flex flex-col gap-y-4 w-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Sipariş detayları</h1>
        <LocalizedClientLink
          href="/hesabim/siparislerim"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#C98484] transition"
          data-testid="back-to-overview-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          <span>Siparişlere dön</span>
        </LocalizedClientLink>
      </div>

      <div
        className="flex flex-col gap-0"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <Items order={order} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ShippingDetails order={order} />
          <OrderSummary order={order} />
        </div>
        {(order as any).fulfillment_status === "delivered" && (
          <ReturnRequest
            orderId={order.id}
            items={((order.items || []) as any[]).map((item) => ({
              id: item.id,
              title: item.title,
              quantity: Number(item.quantity || 0),
              thumbnail: item.thumbnail,
              variant_title: item.variant_title,
            }))}
          />
        )}
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
