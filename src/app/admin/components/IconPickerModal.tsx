"use client"
import React, { useState } from "react"
import MediaSelectorModal from "./MediaSelectorModal"
import {
  APP_ICON_OPTIONS,
  AppIcon,
  Box,
  Building2,
  Folder,
  Image as ImageIcon,
  Sparkles,
  Wrench,
} from "@lib/icons"

export const SELECTABLE_ICONS = APP_ICON_OPTIONS

export default function IconPickerModal({
  isOpen,
  onClose,
  onSelect
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (iconNameOrUrl: string) => void
}) {
  const [activeTab, setActiveTab] = useState<"library" | "custom">("library")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "hirdavat" | "magaza" | "kurumsal">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)

  if (!isOpen) return null

  const filteredIcons = SELECTABLE_ICONS.filter(item => {
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase()) || item.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#C98484]" /> Kurumsal İkon Kütüphanesi
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Kategoriler ve mağazanız için tasarlanmış kurumsal SVG ikon seti
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Top Navigation Bar */}
        <div className="flex border-b border-gray-100 px-4 bg-white">
          <button 
            className={`px-5 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "library" ? "text-[#C98484] border-[#C98484]" : "text-gray-500 border-transparent hover:text-gray-800"}`}
            onClick={() => setActiveTab("library")}
          >
            <Sparkles className="w-4 h-4 text-[#C98484]" />
            <span>Kurumsal İkon Seti</span>
          </button>
          <button 
            className={`px-5 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "custom" ? "text-[#C98484] border-[#C98484]" : "text-gray-500 border-transparent hover:text-gray-800"}`}
            onClick={() => setActiveTab("custom")}
          >
            <Folder className="w-4 h-4 text-[#C98484]" />
            <span>Özel Görsel / SVG Yükle</span>
          </button>
        </div>

        {/* Filter bar for library */}
        {activeTab === "library" && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-gray-50/50 border-b border-gray-100">
            <div className="flex gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${categoryFilter === "all" ? "bg-[#C98484] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
              >
                Tümü ({SELECTABLE_ICONS.length})
              </button>
              <button
                onClick={() => setCategoryFilter("hirdavat")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${categoryFilter === "hirdavat" ? "bg-[#C98484] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
              >
                <Wrench className="w-3.5 h-3.5" /> Hırdavat & Aletler
              </button>
              <button
                onClick={() => setCategoryFilter("magaza")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${categoryFilter === "magaza" ? "bg-[#C98484] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
              >
                <Box className="w-3.5 h-3.5" /> Mağaza & Kargo
              </button>
              <button
                onClick={() => setCategoryFilter("kurumsal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${categoryFilter === "kurumsal" ? "bg-[#C98484] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
              >
                <Building2 className="w-3.5 h-3.5" /> Kurumsal
              </button>
            </div>

            <input
              type="text"
              placeholder="İkon ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg w-36 sm:w-48 focus:outline-none focus:border-[#C98484]"
            />
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          {activeTab === "library" && (
            <div>
              {filteredIcons.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-medium text-sm">
                  Aramanızla eşleşen ikon bulunamadı.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredIcons.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => { onSelect(item.name); onClose(); }}
                      className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-[#C98484] hover:shadow-md hover:-translate-y-0.5 transition-all group"
                    >
                      <div className="p-2.5 bg-gray-50 group-hover:bg-rose-50 text-gray-600 group-hover:text-[#C98484] rounded-lg transition-colors mb-2">
                        <AppIcon name={item.name} className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-700 group-hover:text-[#C98484] truncate w-full text-center">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "custom" && (
            <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-xl bg-white m-2">
              <div className="w-16 h-16 bg-rose-50 text-[#C98484] rounded-full flex items-center justify-center mb-4 shadow-inner">
                <ImageIcon className="w-8 h-8 text-[#C98484]" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Medya Kütüphanesinden İkon / Görsel Seçin</h3>
              <p className="text-xs text-gray-500 font-medium text-center max-w-sm mb-6 leading-relaxed">
                Yüklediğiniz şeffaf arka planlı SVG, PNG veya JPG dosyalarını doğrudan ikon olarak bağlayabilirsiniz.
              </p>
              <button 
                onClick={() => setIsMediaModalOpen(true)}
                className="bg-[#C98484] hover:bg-rose-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                Medya Kütüphanesini Aç
              </button>
            </div>
          )}
        </div>

        <MediaSelectorModal 
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(urls) => {
            if (urls[0]) {
              onSelect(urls[0])
              setIsMediaModalOpen(false)
              onClose()
            }
          }}
          multi={false}
        />
      </div>
    </div>
  )
}
