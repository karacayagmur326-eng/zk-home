"use client"

import { useEffect, useState } from "react"
import { useFormState as useActionState } from "react-dom"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { changeCustomerPassword } from "@lib/data/customer"

const initialState = { success: false, error: null as string | null }

const ProfilePassword = () => {
  const [success, setSuccess] = useState(false)
  const [state, formAction] = useActionState(
    changeCustomerPassword,
    initialState
  )

  useEffect(() => setSuccess(state.success), [state.success])

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label="Şifre"
        currentInfo={<span>Şifreniz güvenlik nedeniyle gösterilmez.</span>}
        isSuccess={success}
        isError={Boolean(state.error)}
        errorMessage={state.error || undefined}
        clearState={() => setSuccess(false)}
        data-testid="account-password-editor"
      >
        <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
          <Input
            label="Mevcut şifre"
            name="old_password"
            autoComplete="current-password"
            required
            type="password"
          />
          <Input
            label="Yeni şifre"
            name="new_password"
            autoComplete="new-password"
            required
            minLength={8}
            type="password"
          />
          <Input
            label="Yeni şifre (tekrar)"
            name="confirm_password"
            autoComplete="new-password"
            required
            minLength={8}
            type="password"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfilePassword
