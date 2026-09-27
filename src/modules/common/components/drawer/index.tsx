"use client"

import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react"
import { X } from "@lib/icons"
import clsx from "clsx"
import { Fragment, ReactNode } from "react"

type DrawerProps = {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: "left" | "right"
  size?: "small" | "medium" | "large"
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  side = "right",
  size = "medium",
}: DrawerProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog className="relative z-[80]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-overlay/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div
            className={clsx(
              "absolute inset-y-0 flex max-w-full",
              side === "left" ? "left-0" : "right-0",
            )}
          >
            <Transition.Child
              as={Fragment}
              enter="transform transition duration-200 ease-out"
              enterFrom={
                side === "left" ? "-translate-x-full" : "translate-x-full"
              }
              enterTo="translate-x-0"
              leave="transform transition duration-150 ease-in"
              leaveFrom="translate-x-0"
              leaveTo={
                side === "left" ? "-translate-x-full" : "translate-x-full"
              }
            >
              <DialogPanel
                className={clsx(
                  "flex h-full w-screen flex-col border-border bg-elevated text-foreground shadow-elevated",
                  side === "left" ? "border-r" : "border-l",
                  size === "small" && "max-w-sm",
                  size === "medium" && "max-w-md",
                  size === "large" && "max-w-2xl",
                )}
              >
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <DialogTitle className="text-ui-lg font-semibold">
                    {title}
                  </DialogTitle>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-base text-muted hover:bg-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X aria-hidden="true" className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
                {footer && (
                  <div className="border-t border-border px-6 py-4">
                    {footer}
                  </div>
                )}
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
