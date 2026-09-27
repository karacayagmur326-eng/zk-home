"use client"

import { Plus } from "@lib/icons"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import CustomerAddressModal from "./customer-address-modal"

const AddAddress = ({
  region,
}: {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:border-[#C98484] hover:bg-rose-50/30 p-6 min-h-[160px] h-full w-full flex flex-col items-center justify-center gap-3 transition-all duration-300 group cursor-pointer shadow-soft hover:shadow-md"
        onClick={() => setIsOpen(true)}
        data-testid="add-address-button"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] group-hover:bg-[#C98484] group-hover:text-white transition-all shadow-2xs">
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div className="text-center">
          <span className="block text-sm font-bold text-slate-800 group-hover:text-[#C98484] transition-colors">
            Yeni Adres Ekle
          </span>
          <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
            Teslimat veya fatura adresi tanımlayın
          </span>
        </div>
      </button>

      <CustomerAddressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        region={region}
      />
    </>
  )
}

export default AddAddress
