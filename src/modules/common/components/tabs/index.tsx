"use client"

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react"
import clsx from "clsx"
import { ReactNode } from "react"

export type TabItem = {
  id: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
}

type TabsProps = {
  items: TabItem[]
  defaultIndex?: number
  selectedIndex?: number
  onChange?: (index: number) => void
  className?: string
}

export default function Tabs({
  items,
  defaultIndex = 0,
  selectedIndex,
  onChange,
  className,
}: TabsProps) {
  return (
    <TabGroup
      defaultIndex={defaultIndex}
      selectedIndex={selectedIndex}
      onChange={onChange}
      className={className}
    >
      <TabList className="flex gap-1 overflow-x-auto border-b border-border">
        {items.map((item) => (
          <Tab
            key={item.id}
            disabled={item.disabled}
            className={({ selected, focus }) =>
              clsx(
                "relative whitespace-nowrap px-4 py-3 text-ui-sm font-medium text-muted outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                selected &&
                  "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary",
                focus && "rounded-t-base ring-2 ring-inset ring-ring",
              )
            }
          >
            {item.label}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {items.map((item) => (
          <TabPanel
            key={item.id}
            className="py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.content}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
