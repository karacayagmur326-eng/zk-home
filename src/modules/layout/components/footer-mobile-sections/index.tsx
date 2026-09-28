"use client"

import { useState } from "react"
import { Building2, ChevronDown, ChevronRight, FileText, Headphones } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type MenuItem = {
  label: string
  url?: string
}

type FooterMobileSectionsProps = {
  kurumsalTitle: string
  kurumsalItems: any[]
  musteriTitle: string
  musteriItems: any[]
  yasalTitle: string
  yasalItems: any[]
}


export default function FooterMobileSections({
  kurumsalTitle,
  kurumsalItems,
  musteriTitle,
  musteriItems,
  yasalTitle,
  yasalItems,
}: FooterMobileSectionsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    kurumsal: true,
    musteri: true,
    yasal: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const sections = [
    {
      key: "kurumsal",
      title: kurumsalTitle,
      icon: Building2,
      items: kurumsalItems,
    },
    {
      key: "musteri",
      title: musteriTitle,
      icon: Headphones,
      items: musteriItems,
    },
    {
      key: "yasal",
      title: yasalTitle,
      icon: FileText,
      items: yasalItems,
    },
  ]

  return (
    <div className="md:hidden flex flex-col divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden my-4">
      {sections.map((section) => {
        const isOpen = !!openSections[section.key]
        const Icon = section.icon

        return (
          <div key={section.key} className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleSection(section.key)}
              className="flex items-center justify-between px-3.5 py-2.5 text-left text-[11px] font-semibold normal-case text-white tracking-wide transition-colors hover:bg-white/[0.04] focus:outline-none"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[#C98484]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>{section.title}</span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#C98484] transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-3.5 pb-2.5 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <ul className="flex flex-col space-y-0.5 pl-8">
                  {section.items.map((item, index) => (
                    <li key={index}>
                      <LocalizedClientLink
                        href={item.url || "#"}
                        className="flex items-center justify-between py-1 text-[11.5px] font-medium text-white/70 hover:text-white transition-colors group"
                      >
                        <span className="group-hover:text-[#C98484] group-hover:translate-x-0.5 transition-all">{item.label}</span>
                        <ChevronRight className="h-3 w-3 text-[#C98484]/60 group-hover:text-[#C98484] group-hover:translate-x-0.5 transition-all" />
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
