import { Dialog, Transition } from "@headlessui/react"
import { clx } from "@modules/common/components/ui"
import React, { Fragment } from "react"

import { ModalProvider, useModal } from "@lib/context/modal-context"
import { X } from "@lib/icons"

type ModalProps = {
  isOpen: boolean
  close: () => void
  size?: "small" | "medium" | "large"
  search?: boolean
  children: React.ReactNode
  position?: "center" | "bottom"
  panelClassName?: string
  overlayClassName?: string
  unstyledPanel?: boolean
  "data-testid"?: string
}

const Modal = ({
  isOpen,
  close,
  size = "medium",
  search = false,
  position = "center",
  panelClassName,
  overlayClassName,
  unstyledPanel = false,
  children,
  "data-testid": dataTestId,
}: ModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[75]" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={clx(
              "fixed inset-0 h-screen bg-overlay/60 backdrop-blur-sm",
              overlayClassName
            )}
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-hidden">
          <div
            className={clx(
              "flex h-full min-h-full justify-center p-4 text-center",
              {
                "items-center": position === "center" && !search,
                "items-start": position === "center" && search,
                "items-end p-0": position === "bottom",
              }
            )}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                data-testid={dataTestId}
                className={clx(
                  "flex w-full transform flex-col justify-start text-left align-middle text-foreground transition-all",
                  !unstyledPanel && "h-fit max-h-[75vh] p-5",
                  {
                    "max-w-md": !unstyledPanel && size === "small",
                    "max-w-xl": !unstyledPanel && size === "medium",
                    "max-w-3xl": !unstyledPanel && size === "large",
                    "bg-transparent shadow-none": !unstyledPanel && search,
                    "rounded-rounded border border-border bg-elevated shadow-elevated":
                      !unstyledPanel && !search,
                  },
                  panelClassName
                )}
              >
                <ModalProvider close={close}>{children}</ModalProvider>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { close } = useModal()

  return (
    <Dialog.Title className="flex items-center justify-between">
      <div className="text-large-semi">{children}</div>
      <div>
        <button
          type="button"
          aria-label="Kapat"
          onClick={close}
          data-testid="close-modal-button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-base text-muted hover:bg-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>
    </Dialog.Title>
  )
}

const Description: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Dialog.Description className="text-small-regular flex h-full items-center justify-center pb-4 pt-2 text-muted">
      {children}
    </Dialog.Description>
  )
}

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-center">{children}</div>
}

const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex items-center justify-end gap-x-4">{children}</div>
}

Modal.Title = Title
Modal.Description = Description
Modal.Body = Body
Modal.Footer = Footer

export default Modal
