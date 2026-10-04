"use client"

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react"
import { useState } from "react"
import { Check, ChevronDown, MapPin, X } from "@lib/icons"

type Props = {
  name: "city" | "district"
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  invalid: boolean
  disabled?: boolean
}

export default function LocationSelect({ name, label, value, options, onChange, invalid, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const matches = options.filter(option => option.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR").trim()))

  return (
    <div>
      <label id={`register-${name}-label`} htmlFor={`register-${name}-button`} className="mb-1.5 block text-xs font-bold text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        {/* Keep the selected value and required validation in the form without invoking a device picker. */}
        <select name={name} value={value} onChange={event => onChange(event.target.value)} required
          tabIndex={-1} aria-hidden="true" className="hidden">
          <option value="">{label} seçiniz</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <button id={`register-${name}-button`} data-location-field={name} type="button" disabled={disabled}
          aria-haspopup="dialog" aria-expanded={open} aria-invalid={invalid}
          aria-describedby={invalid ? "register-validation-error" : disabled ? "register-district-hint" : undefined}
          onClick={() => { setSearch(""); setOpen(true) }}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-base font-medium text-slate-800 outline-none transition-colors focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/20 disabled:bg-slate-50 disabled:text-slate-400 sm:text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="min-w-0 flex-1">{value || (disabled ? "Önce il seçiniz" : `${label} seçiniz`)}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      </div>
      {disabled && <p id="register-district-hint" className="mt-1.5 text-xs text-slate-500">İlçeleri görmek için önce il seçin.</p>}
      <Dialog open={open} onClose={setOpen} className="relative z-[200]">
        <div className="fixed inset-0 bg-slate-950/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="flex max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <DialogTitle className="text-lg font-bold">{label} seçiniz</DialogTitle>
              <button type="button" onClick={() => setOpen(false)} aria-label="Seçim penceresini kapat" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <input type="search" aria-label={`${label} ara`} placeholder={`${label} ara…`} value={search}
              onChange={event => setSearch(event.target.value)}
              className="mb-3 h-12 w-full shrink-0 rounded-xl border border-slate-200 px-3 text-base outline-none focus:border-[#C98484]" />
            <ul aria-label={`${label} seçenekleri`} className="min-h-0 overflow-y-auto overscroll-contain">
              {matches.map(option => <li key={option}>
                <button type="button" onClick={() => { onChange(option); setOpen(false) }}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-base hover:bg-rose-50 focus:bg-rose-50 focus:outline-none ${value === option ? "bg-rose-50 font-semibold text-[#a45d5f]" : "text-slate-800"}`}>
                  {option}{value === option && <Check className="h-5 w-5" aria-hidden="true" />}
                </button>
              </li>)}
            </ul>
            {!matches.length && <p className="py-6 text-center text-sm text-slate-500">Sonuç bulunamadı.</p>}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
