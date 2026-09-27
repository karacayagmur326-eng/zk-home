import { ShoppingCart } from "@lib/icons"
import { Heading, Text } from "@modules/common/components/ui"
import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center"
      data-testid="empty-cart-message"
    >
      <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-[#C98484]">
        <ShoppingCart className="h-7 w-7" />
      </span>
      <Heading level="h1" className="text-2xl font-black text-gray-950">
        Sepetiniz boş
      </Heading>
      <Text className="mb-6 mt-3 max-w-[32rem] text-sm text-gray-500">
        İhtiyacınız olan profesyonel ekipmanı mağazamızda keşfedin.
      </Text>
      <InteractiveLink href="/magaza">Ürünleri İncele</InteractiveLink>
    </div>
  )
}

export default EmptyCartMessage
