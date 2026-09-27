"use client"

import React, { useState, useEffect } from "react"
import { PencilSquare as Edit, Spinner, Trash } from "@lib/icons"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text, clx } from "@modules/common/components/ui"
import { deleteCustomerAddress } from "@lib/data/customer"
import CustomerAddressModal from "./customer-address-modal"

type EditAddressProps = {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
  isActive?: boolean
}

const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address,
  isActive = false,
}) => {
  const [removing, setRemoving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const editId = params.get("edit")
      if (editId && (editId === address.id || editId === "true" || editId === "default")) {
        setIsOpen(true)
      }
    }
  }, [address.id])

  const removeAddress = async () => {
    setRemoving(true)
    try {
      await deleteCustomerAddress(address.id)
    } finally {
      setRemoving(false)
    }
  }

  const metadata = (address.metadata || {}) as Record<string, any>
  const addressType = metadata.address_type === "kurumsal" || address.company ? "Kurumsal" : "Bireysel"

  return (
    <>
      <div
        className={clx(
          "rounded-3xl border border-slate-100 bg-white p-6 min-h-[160px] h-full w-full flex flex-col justify-between transition-all shadow-soft hover:shadow-md",
          {
            "border-[#C98484] ring-2 ring-[#C98484]/10": isActive,
          }
        )}
        data-testid="address-container"
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <Heading
              className="text-left text-base font-bold text-slate-900"
              data-testid="address-name"
            >
              {address.first_name} {address.last_name}
            </Heading>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {addressType}
              </span>
              {address.is_default_shipping && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#C98484] text-[10px] font-extrabold">
                  Varsayılan Teslimat
                </span>
              )}
              {address.is_default_billing && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-extrabold">
                  Varsayılan Fatura
                </span>
              )}
            </div>
          </div>
          {address.company && (
            <Text
              className="text-xs font-semibold text-slate-500 mt-0.5"
              data-testid="address-company"
            >
              {address.company}
              {metadata.tax_office && ` (${metadata.tax_office} V.D. - ${metadata.tax_number || ""})`}
            </Text>
          )}
          <Text className="flex flex-col text-left text-xs font-medium text-slate-600 leading-relaxed mt-2.5">
            <span data-testid="address-address">
              {address.address_1}
              {address.address_2 && <span>, {address.address_2}</span>}
            </span>
            <span data-testid="address-postal-city" className="text-slate-500 text-[11px] mt-0.5">
              {address.postal_code}, {metadata.district || address.province ? `${metadata.district || address.province} / ` : ""}{address.city}
            </span>
            <span data-testid="address-province-country" className="text-slate-500 text-[11px]">
              {address.country_code?.toUpperCase() || "TR"}
            </span>
          </Text>
        </div>
        <div className="flex items-center gap-x-4 pt-4 mt-3 border-t border-slate-100">
          <button
            type="button"
            className="text-xs font-bold text-slate-700 hover:text-[#C98484] flex items-center gap-x-1.5 transition-colors"
            onClick={() => setIsOpen(true)}
            data-testid="address-edit-button"
          >
            <Edit className="h-3.5 w-3.5" />
            Düzenle
          </button>
          <button
            type="button"
            className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-x-1.5 transition-colors"
            onClick={removeAddress}
            data-testid="address-delete-button"
          >
            {removing ? (
              <Spinner className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash className="h-3.5 w-3.5" />
            )}
            Sil
          </button>
        </div>
      </div>

      <CustomerAddressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        address={address}
        region={region}
      />
    </>
  )
}

export default EditAddress
