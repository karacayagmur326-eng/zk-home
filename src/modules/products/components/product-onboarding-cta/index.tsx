import { Button, Container, Text } from "@modules/common/components/ui"
import { cookies as nextCookies } from "next/headers"

async function ProductOnboardingCta() {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_zkhome_onboarding")?.value === "true"

  if (!isOnboarding) {
    return null
  }

  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full p-8">
      <div className="flex flex-col gap-y-4 center">
        <Text className="text-ui-fg-base text-xl">
          Örnek ürününüz başarıyla oluşturuldu.
        </Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          Mağaza kurulumuna yönetim panelinden devam edebilirsiniz.
        </Text>
        <a href="/admin">
          <Button className="w-full">Yönetim panelinde devam et</Button>
        </a>
      </div>
    </Container>
  )
}

export default ProductOnboardingCta
