import { Text, clx } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"

export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <>
      <Text
        className={clx("text-lg font-bold text-[#A95E5E]", {
          "text-[#A95E5E]": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
      {price.price_type === "sale" && (
        <Text
          className="text-sm text-gray-500 line-through ml-2"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
    </>
  )
}
