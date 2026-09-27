import React from "react"
import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"
import { Headphones, ArrowRight } from "@lib/icons"
import { SellerQuestionButton } from "@components/common/SellerQuestion"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {

  if (!customer) {
    return (
      <main className="min-h-screen bg-[#F8F9FA] py-4 sm:py-10" data-testid="account-page">
        <div className="content-container mx-auto max-w-[1440px] max-sm:px-0">{children}</div>
      </main>
    )
  }

  return (
    <main
      className="flex-1 bg-[#F8F9FA] py-0 md:py-12 min-h-screen text-slate-900"
      data-testid="account-page"
    >
      <div className="content-container mx-auto max-md:px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Left Floating Sidebar */}
          <div className="hidden md:block"><AccountNav customer={customer} /></div>

          {/* Main Account Area */}
          <div className="min-w-0 flex-1 space-y-6">
            {children}

            {/* Sorunuz mu var? Banner */}
            <div className="relative hidden overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-soft md:flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-50/50 blur-2xl" />

              <div className="flex items-center gap-4 z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50/90 text-[#C98484] border border-rose-100/60 shadow-2xs">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Sorunuz mu var?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-lg">
                    Siparişiniz veya ürünlerimizle ilgili sorunuzu doğrudan satıcıya iletin.
                  </p>
                </div>
              </div>

              <SellerQuestionButton
                className="z-10 shrink-0 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#C98484] hover:bg-rose-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-500/20 transition-all transform hover:-translate-y-0.5"
              >
                <span>Satıcıya Sor</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </SellerQuestionButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AccountLayout
