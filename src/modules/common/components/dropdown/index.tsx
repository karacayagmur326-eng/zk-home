"use client"

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import clsx from "clsx"
import { ReactNode } from "react"

export type DropdownItem = {
  id: string
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
  danger?: boolean
  onSelect: () => void
}

type DropdownProps = {
  trigger: ReactNode
  items: DropdownItem[]
  align?: "left" | "right"
  className?: string
}

export default function Dropdown({
  trigger,
  items,
  align = "right",
  className,
}: DropdownProps) {
  return (
    <Menu as="div" className={clsx("relative inline-flex", className)}>
      <MenuButton className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        {trigger}
      </MenuButton>
      <MenuItems
        transition
        anchor={align === "right" ? "bottom end" : "bottom start"}
        className="z-[90] mt-2 w-56 origin-top rounded-rounded border border-border bg-elevated p-1 text-foreground shadow-elevated transition duration-100 ease-out [--anchor-gap:0.5rem] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {items.map((item) => (
          <MenuItem key={item.id} disabled={item.disabled}>
            {({ focus }) => (
              <button
                type="button"
                onClick={item.onSelect}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-base px-3 py-2 text-left text-ui-sm disabled:cursor-not-allowed disabled:opacity-50",
                  focus && "bg-subtle",
                  item.danger ? "text-danger" : "text-foreground",
                )}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}
