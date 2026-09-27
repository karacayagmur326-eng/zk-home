import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50 p-4">
      <div>
        <Heading level="h2" className="txt-xlarge">
          Hesabınız var mı?
        </Heading>
        <Text className="txt-medium text-ui-fg-subtle mt-2">
          Siparişlerinizi takip etmek için giriş yapın.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/hesabim">
          <Button
            variant="secondary"
            className="h-10"
            data-testid="sign-in-button"
          >
            Giriş Yap
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
