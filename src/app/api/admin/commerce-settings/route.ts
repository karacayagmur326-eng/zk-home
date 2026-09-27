import { NextRequest, NextResponse } from "next/server"

import { getAdminSession } from "@lib/admin/auth"
import {
  getCommerceSettings,
  saveCommerceSettings,
  type CommerceSettings,
} from "@lib/commerce/settings"

const text = (value: unknown, max = 160) =>
  String(value || "").trim().slice(0, max)
const cents = (value: unknown) =>
  Math.max(0, Math.min(Math.round(Number(value) || 0), 100_000_000_00))

async function authorized() {
  return Boolean(await getAdminSession(["Admin"]))
}

export async function GET() {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  return NextResponse.json({ settings: await getCommerceSettings() })
}

export async function PUT(req: NextRequest) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz ayar verisi." }, { status: 400 })
  }
  const current = await getCommerceSettings()
  const shippingMethods = Array.isArray(body.shipping_methods)
    ? body.shipping_methods.slice(0, 20).map((method: any, index: number) => ({
        id: text(method.id, 60) || String(index + 1),
        name: text(method.name, 100),
        coverage: text(method.coverage, 120),
        price: cents(method.price),
        freeThreshold:
          method.freeThreshold === null || method.freeThreshold === ""
            ? null
            : cents(method.freeThreshold),
        estimatedDays: text(method.estimatedDays, 80),
        active: Boolean(method.active),
        icon: ["truck", "zap", "store"].includes(method.icon)
          ? method.icon
          : "truck",
      }))
    : current.shipping_methods
  if (shippingMethods.some((method: { name: string }) => !method.name)) {
    return NextResponse.json(
      { error: "Her teslimat yönteminin adı olmalıdır." },
      { status: 400 }
    )
  }

  const bankAccounts = Array.isArray(body.bank_accounts)
    ? body.bank_accounts.slice(0, 10).map((account: any, index: number) => ({
        id: text(account.id, 60) || String(index + 1),
        bankName: text(account.bankName, 100),
        accountHolder: text(account.accountHolder, 140),
        branch: text(account.branch, 100),
        iban: text(account.iban, 40).replace(/\s+/g, "").toUpperCase(),
        referenceCode: text(account.referenceCode, 100),
        active: Boolean(account.active),
        isDefault: Boolean(account.isDefault),
        showInCheckout: Boolean(account.showInCheckout),
      }))
    : current.bank_accounts
  const invalidIban = bankAccounts.find(
    (account: { active: boolean; showInCheckout: boolean; iban: string; bankName: string }) =>
      (account.active || account.showInCheckout) &&
      !/^TR\d{24}$/.test(account.iban)
  )
  if (invalidIban) {
    return NextResponse.json(
      { error: `${invalidIban.bankName || "Banka hesabı"} için geçerli TR IBAN girin.` },
      { status: 400 }
    )
  }

  const paymentMethods = {
    creditCard: Boolean(body.payment_methods?.creditCard),
    bankTransfer: Boolean(body.payment_methods?.bankTransfer),
    cashOnDelivery: Boolean(body.payment_methods?.cashOnDelivery),
    installment: Boolean(body.payment_methods?.installment),
    maxInstallment: text(body.payment_methods?.maxInstallment || "1", 2),
  }
  if (
    paymentMethods.bankTransfer &&
    !bankAccounts.some(
      (account: { active: boolean; showInCheckout: boolean; accountHolder: string; iban: string }) =>
        account.active &&
        account.showInCheckout &&
        account.accountHolder &&
        /^TR\d{24}$/.test(account.iban)
    )
  ) {
    return NextResponse.json(
      { error: "Havale/EFT için ödeme ekranında gösterilecek aktif bir banka hesabı gerekir." },
      { status: 400 }
    )
  }
  if (
    !paymentMethods.creditCard &&
    !paymentMethods.bankTransfer &&
    !paymentMethods.cashOnDelivery
  ) {
    return NextResponse.json(
      { error: "En az bir ödeme yöntemi etkin olmalıdır." },
      { status: 400 }
    )
  }

  const vatRate = Math.max(
    0,
    Math.min(Number(body.tax_settings?.vatRate || 0), 100)
  )
  const settings: CommerceSettings = {
    ...current,
    shipping_methods: shippingMethods as CommerceSettings["shipping_methods"],
    bank_accounts: bankAccounts,
    payment_methods: paymentMethods,
    tax_settings: {
      includeVat: Boolean(body.tax_settings?.includeVat),
      vatRate: String(vatRate),
      currency: "TRY",
      showPricesWithVat: Boolean(body.tax_settings?.showPricesWithVat),
      roundPrices: Boolean(body.tax_settings?.roundPrices),
    },
    invoice_settings: {
      provider: text(body.invoice_settings?.provider || "manual", 100),
      autoInvoice: Boolean(body.invoice_settings?.autoInvoice),
      invoicePrefix: text(body.invoice_settings?.invoicePrefix || "SCH", 12)
        .replace(/[^A-Z0-9_-]/gi, "")
        .toUpperCase(),
      nextInvoiceNo: text(body.invoice_settings?.nextInvoiceNo || "1", 30),
    },
    order_settings: {
      autoConfirm: Boolean(body.order_settings?.autoConfirm),
      stockReserve: true,
      cancelWindow: String(
        Math.max(0, Math.min(Number(body.order_settings?.cancelWindow || 24), 168))
      ),
      requirePhone: Boolean(body.order_settings?.requirePhone),
      guestCheckout: Boolean(body.order_settings?.guestCheckout),
      minOrderAmount: String(cents(body.order_settings?.minOrderAmount)),
    },
  }
  const saved = await saveCommerceSettings(settings)
  return NextResponse.json({
    success: true,
    settings: saved,
    message: "Mağaza ayarları kaydedildi.",
  })
}
