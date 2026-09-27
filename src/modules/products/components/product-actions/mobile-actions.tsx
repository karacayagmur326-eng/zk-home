import { Transition } from "@headlessui/react"
import { Button, clx } from "@modules/common/components/ui"
import Modal from "@modules/common/components/modal"
import React, { Fragment, useMemo } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { ChevronDown, X } from "@lib/icons"

import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"
import { isSimpleProduct } from "@lib/util/product"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const { state, open, close } = useToggleState()

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }
    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const isSimple = isSimpleProduct(product)

  return (
    <>
      <div
        className={clx("lg:hidden inset-x-0 bottom-0 fixed z-50", {
          "pointer-events-none": !show,
        })}
      >
        <Transition
          as={Fragment}
          show={show}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="flex h-full w-full flex-col justify-center gap-y-2.5 border-t border-gray-200 bg-white px-3 pt-3 text-sm shadow-[0_-10px_30px_rgba(15,23,42,0.12)] pb-[max(12px,env(safe-area-inset-bottom))] sm:px-4"
            data-testid="mobile-actions"
          >
            <div className="flex w-full min-w-0 items-end justify-between gap-3">
              <span
                data-testid="mobile-title"
                className="min-w-0 flex-1 truncate text-xs font-medium text-gray-600"
              >
                {product.title}
              </span>
              {selectedPrice ? (
                <div className="flex shrink-0 items-end gap-x-1.5 text-right text-ui-fg-base">
                  {selectedPrice.price_type === "sale" && (
                    <p>
                      <span className="text-[10px] text-gray-400 line-through">
                        {selectedPrice.original_price}
                      </span>
                    </p>
                  )}
                  <span
                    className={clx("text-sm font-bold", {
                      "text-ui-fg-interactive":
                        selectedPrice.price_type === "sale",
                    })}
                  >
                    {selectedPrice.calculated_price}
                  </span>
                </div>
              ) : (
                <div></div>
              )}
            </div>
            <div
              className={clx("grid w-full grid-cols-2 gap-2.5", {
                "!grid-cols-1": isSimple,
              })}
            >
              {!isSimple && (
                <Button
                  onClick={open}
                  variant="secondary"
                  className="min-h-11 w-full px-3 text-xs"
                  data-testid="mobile-actions-button"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {variant
                        ? Object.values(options).join(" / ")
                        : "Seçenekleri Belirle"}
                    </span>
                    <ChevronDown />
                  </div>
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={!inStock || !variant}
                className="min-h-11 w-full px-3 text-xs"
                isLoading={isAdding}
                data-testid="mobile-cart-button"
              >
                {!variant
                  ? "Seçenek Belirleyin"
                  : !inStock
                  ? "Stokta Yok"
                  : "Sepete Ekle"}
              </Button>
            </div>
          </div>
        </Transition>
      </div>
      <Modal
        isOpen={state}
        close={close}
        position="bottom"
        unstyledPanel
        overlayClassName="bg-gray-700/75"
        panelClassName="h-full overflow-hidden gap-y-3"
        data-testid="mobile-actions-modal"
      >
        <div className="w-full flex justify-end pr-6">
          <button
            type="button"
            aria-label="Kapat"
            onClick={close}
            className="bg-white w-12 h-12 rounded-full text-ui-fg-base flex justify-center items-center"
            data-testid="close-modal-button"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="bg-white px-6 py-12">
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-6">
              {(product.options || []).map((option) => (
                <div key={option.id}>
                  <OptionSelect
                    option={option}
                    current={options[option.id]}
                    updateOption={updateOptions}
                    title={option.title ?? ""}
                    disabled={optionsDisabled}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

export default MobileActions
