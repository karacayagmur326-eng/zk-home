import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SellerQuestionButton } from "@components/common/SellerQuestion"
import React from "react"

const Help = () => {
  return (
    <div className="mt-2">
      {/* Section header */}
      <h2 className="text-base font-bold text-slate-800 mb-4">
        Yardıma mı ihtiyacınız var?
      </h2>

      {/* Quick links row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <LocalizedClientLink
          href="/iletisim"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-[#C98484] hover:text-[#C98484] bg-white transition group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            className="w-4 h-4 text-slate-400 group-hover:text-[#C98484] transition"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.816-.761c.032-.239.117-.604.298-1.025A5.975 5.975 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
            />
          </svg>
          <span>İletişim</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#C98484] transition"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </LocalizedClientLink>

        <LocalizedClientLink
          href="/iletisim"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-[#C98484] hover:text-[#C98484] bg-white transition group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            className="w-4 h-4 text-slate-400 group-hover:text-[#C98484] transition"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <span>İade &amp; Değişim</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#C98484] transition"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </LocalizedClientLink>
      </div>

      {/* Customer service banner */}
      <div className="flex items-center justify-between gap-4 bg-rose-50 border border-rose-100 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-[#C98484] flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Sorunuz mu var?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Siparişiniz veya ürünlerimizle ilgili sorunuzu doğrudan satıcıya iletin.
            </p>
          </div>
        </div>
        <SellerQuestionButton
          className="flex-shrink-0 flex items-center gap-2 bg-[#C98484] hover:bg-[#A95E5E] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
        >
          Satıcıya Sor
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </SellerQuestionButton>
      </div>
    </div>
  )
}

export default Help
