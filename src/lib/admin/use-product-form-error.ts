"use client"

import { useEffect, useState } from "react"

export function useProductFormError(activeTab: string, setActiveTab: (tab: string) => void) {
  const [failure, setFailure] = useState({ message: "", sequence: 0 })
  const error = failure.message
  const errorField = /fiyat|price/i.test(error) ? "price"
    : /sku|stok kodu/i.test(error) ? "sku"
    : /ürün adı|title/i.test(error) ? "title" : ""

  function setError(message: string) {
    setFailure(previous => ({ message, sequence: previous.sequence + 1 }))
  }

  useEffect(() => {
    if (!error) return
    const requiredTab = errorField === "sku" ? "stock" : errorField === "price" ? "general" : null
    if (requiredTab && activeTab !== requiredTab) {
      setActiveTab(requiredTab)
      return
    }
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(errorField ? `product-${errorField}` : "product-form-error")
      if (!target) return
      target.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
      target.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [error, failure.sequence, errorField, activeTab, setActiveTab])

  function fieldProps(field: string) {
    const invalid = errorField === field && Boolean(error)
    return {
      id: `product-${field}`,
      "aria-invalid": invalid,
      "aria-describedby": invalid ? `product-${field}-error` : undefined,
      style: invalid ? { borderColor: "#dc2626", boxShadow: "0 0 0 3px #fee2e2", scrollMarginTop: 120 } : undefined,
    }
  }

  return { error, setError, errorField, fieldProps }
}
