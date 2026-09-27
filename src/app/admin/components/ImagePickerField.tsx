"use client"

import React, { useState } from "react"
import Image from "@components/common/SmartImage"
import { Image as ImageIcon, Upload, X } from "lucide-react"
import MediaSelectorModal from "./MediaSelectorModal"

interface ImagePickerFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  helpText?: string
}

export default function ImagePickerField({
  label,
  value,
  onChange,
  helpText,
}: ImagePickerFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        {label}
      </label>

      <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
        {/* Image Thumbnail Preview */}
        <div className="relative w-16 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0 flex items-center justify-center">
          {value ? (
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover object-center"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-0.5">Görsel Yok</span>
            </div>
          )}
        </div>

        {/* Action Controls (Clean Buttons Only, No Raw URL Text Input) */}
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-[#C98484] hover:bg-[#A95E5E] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{value ? "Görseli Değiştir" : "Tıkla & Görsel Seç"}</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Kaldır</span>
              </button>
            )}
          </div>

          {helpText && <p className="text-[11px] text-slate-500 font-normal">{helpText}</p>}
        </div>
      </div>

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(urls) => {
          if (urls.length > 0) {
            onChange(urls[0])
          }
          setIsModalOpen(false)
        }}
        multi={false}
        allowIcons={false}
      />
    </div>
  )
}
