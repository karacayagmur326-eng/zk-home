import { Checkbox } from "@modules/common/components/ui"
import React, { useId } from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  "data-testid"?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  "data-testid": dataTestId,
}) => {
  const id = useId()

  return (
    <Checkbox
      className="text-base-regular"
      containerClassName="space-x-2"
      id={id}
      checked={checked}
      onChange={onChange}
      name={name}
      label={label}
      labelClassName="!transform-none !txt-medium"
      data-testid={dataTestId}
    />
  )
}

export default CheckboxWithLabel
