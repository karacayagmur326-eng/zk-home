import { Badge } from "@modules/common/components/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">Dikkat:</span> Yalnızca deneme amaçlıdır.
    </Badge>
  )
}

export default PaymentTest
