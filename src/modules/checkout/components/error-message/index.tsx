import { FormError } from "@modules/common/components/feedback"

const ErrorMessage = ({
  error,
  "data-testid": dataTestid,
}: {
  error?: string | null
  "data-testid"?: string
}) => <FormError message={error} data-testid={dataTestid} />

export default ErrorMessage
