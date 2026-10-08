import { query, cachedQuery } from "@lib/admin/db"
import { ensureCommerceSchema } from "./schema"
import { legacyShippingRanges } from "./shipping"

export type ShippingPriceRange = { id: string; min: number; max: number | null; price: number; admin_name?: string }

export type ShippingMethodSetting = {
  id: string
  name: string
  coverage: string
  price: number
  freeThreshold: number | null
  estimatedDays: string
  active: boolean
  icon: "truck" | "zap" | "store"
}

export type PaymentMethodRow = {
  id: string
  name: string
  subtitle: string
  provider: string
  providerLabel: string
  commission: string
  isDefault: boolean
  mode: "canli" | "test"
  installmentInfo: string
  refundInfo: string
  security: string
  active: boolean
  badge?: string
  iconType: "card" | "bank" | "cod" | "wallet"
}

export type BankAccountRow = {
  id: string
  bankName: string
  accountHolder: string
  branch: string
  iban: string
  referenceCode: string
  active: boolean
  isDefault: boolean
  showInCheckout: boolean
}

export type PaymentMethodsSetting = {
  creditCard: boolean
  bankTransfer: boolean
  cashOnDelivery: boolean
  installment: boolean
  maxInstallment: string
}

export type TaxSetting = {
  includeVat: boolean
  vatRate: string
  currency: string
  showPricesWithVat: boolean
  roundPrices: boolean
}

export type InvoiceSetting = {
  provider: string
  autoInvoice: boolean
  invoicePrefix: string
  nextInvoiceNo: string
}

export type OrderSetting = {
  autoConfirm: boolean
  stockReserve: boolean
  cancelWindow: string
  requirePhone: boolean
  guestCheckout: boolean
  minOrderAmount: string
}

export type CommerceSettings = {
  shipping_name: string
  shipping_fee: number
  free_shipping_threshold: number
  bank_name: string
  bank_iban: string
  bank_account_name: string
  invoice_provider: string
  shipping_methods: ShippingMethodSetting[]
  shipping_ranges?: ShippingPriceRange[]
  payment_methods_list: PaymentMethodRow[]
  payment_methods_priority: string[]
  bank_accounts: BankAccountRow[]
  transfer_instructions: string[]
  customer_notice_text: string
  monthly_transfer_total: string
  shipping_info: string
  excluded_regions: string[]
  cod_fee_active: boolean
  cod_fee_amount: number
  desi_based_active: boolean
  default_desi: number
  buyer_pays: boolean
  payment_methods: PaymentMethodsSetting
  tax_settings: TaxSetting
  invoice_settings: InvoiceSetting
  order_settings: OrderSetting
}

export const defaultPaymentMethodsList: PaymentMethodRow[] = [
  {
    id: "card",
    name: "Kredi / Banka Kartı",
    subtitle: "Visa, MasterCard, Troy",
    provider: "",
    providerLabel: "Entegrasyon gerekli",
    commission: "",
    isDefault: true,
    mode: "test",
    installmentInfo: "",
    refundInfo: "",
    security: "",
    active: true,
    iconType: "card",
  },
  {
    id: "bank",
    name: "Havale / EFT",
    subtitle: "Tüm bankalar",
    provider: "—",
    providerLabel: "Manuel",
    commission: "%0,00 Sabit ücret yok",
    isDefault: false,
    mode: "canli",
    installmentInfo: "Taksit yok",
    refundInfo: "Manuel 3 gün",
    security: "—",
    active: false,
    iconType: "bank",
  },
  {
    id: "cod",
    name: "Kapıda Ödeme",
    subtitle: "Nakit / POS",
    provider: "—",
    providerLabel: "Manuel",
    commission: "%1,50 + 2,00 TL",
    isDefault: false,
    mode: "canli",
    installmentInfo: "Taksit yok",
    refundInfo: "Manuel 3 gün",
    security: "—",
    active: false,
    iconType: "cod",
  },
  {
    id: "wallet",
    name: "Mağaza Bakiyesi / Cüzdan",
    subtitle: "Ön ödemeli bakiye kullanımı",
    provider: "—",
    providerLabel: "Dahili",
    commission: "%0,00 Sabit ücret yok",
    isDefault: false,
    mode: "canli",
    installmentInfo: "Taksit yok",
    refundInfo: "Otomatik 7 gün",
    security: "—",
    active: false,
    iconType: "wallet",
  },
]

export const defaultBankAccounts: BankAccountRow[] = []

export const defaultCommerceSettings: CommerceSettings = {
  shipping_name: "Standart Kargo",
  shipping_fee: 9900,
  free_shipping_threshold: 250000,
  bank_name: "",
  bank_iban: "",
  bank_account_name: "",
  invoice_provider: "manual",
  shipping_methods: [
    { id: "1", name: "Standart Kargo", coverage: "Tüm Türkiye", price: 9900, freeThreshold: 250000, estimatedDays: "2 - 4 iş günü", active: true, icon: "truck" },
    { id: "2", name: "Hızlı Teslimat", coverage: "Seçili şehirler", price: 14900, freeThreshold: 300000, estimatedDays: "1 - 2 iş günü", active: true, icon: "zap" },
    { id: "3", name: "Mağazadan Teslim", coverage: "Ücretsiz", price: 0, freeThreshold: null, estimatedDays: "Aynı gün", active: true, icon: "store" },
  ],
  payment_methods_list: defaultPaymentMethodsList,
  payment_methods_priority: ["card", "bank", "cod", "wallet"],
  bank_accounts: defaultBankAccounts,
  transfer_instructions: [
    "Sipariş tutarını eksiksiz gönderin.",
    "Açıklama kodunu doğru yazın.",
    "Farklı tutar göndermeyin.",
    "Dekontu saklayın.",
  ],
  customer_notice_text: "Siparişiniz onaylandıktan sonra, aşağıdaki banka hesaplarımızdan birine ödemenizi gerçekleştirebilirsiniz. Ödemenizi yaptıktan sonra dekont yüklemeyi unutmayınız. Ödemeniz kontrol edildikten sonra siparişiniz onaylanacaktır.",
  monthly_transfer_total: "",
  shipping_info: "Siparişleriniz 1-4 iş günü içerisinde kargoya teslim edilmektedir.",
  excluded_regions: ["KKTC", "Yurtdışı", "Askeri Bölgeler"],
  cod_fee_active: true,
  cod_fee_amount: 2000,
  desi_based_active: false,
  default_desi: 1,
  buyer_pays: false,
  payment_methods: {
    creditCard: true,
    bankTransfer: false,
    cashOnDelivery: false,
    installment: true,
    maxInstallment: "12",
  },
  tax_settings: {
    includeVat: true,
    vatRate: "20",
    currency: "TRY",
    showPricesWithVat: true,
    roundPrices: true,
  },
  invoice_settings: {
    provider: "manual",
    autoInvoice: false,
    invoicePrefix: "SCH",
    nextInvoiceNo: "1001",
  },
  order_settings: {
    autoConfirm: false,
    stockReserve: true,
    cancelWindow: "24",
    requirePhone: true,
    guestCheckout: true,
    minOrderAmount: "0",
  },
}

export async function getCommerceSettings(): Promise<CommerceSettings> {
  await ensureCommerceSchema()
  const rows = await cachedQuery<{ value: Partial<CommerceSettings> }>(
    "commerce-settings",
    "SELECT value FROM store_setting WHERE key='commerce' LIMIT 1"
  )
  const stored = rows[0]?.value || {}
  const legacyDemoIbans = new Set([
    "TR120001000234567890123456",
    "TR120001000234567890123456",
    "",
    "TR560006200123400006293456",
    "",
  ])
  const normalizedIban = (value: unknown) =>
    String(value || "").replace(/\s+/g, "").toUpperCase()
  const cleanedAccounts = Array.isArray(stored.bank_accounts)
    ? stored.bank_accounts.filter(
        (account) => !legacyDemoIbans.has(normalizedIban(account?.iban))
      )
    : defaultBankAccounts
  const cleanedPaymentMethods = Array.isArray(stored.payment_methods_list)
    ? stored.payment_methods_list.map((method) =>
        method.provider === "PARAM" && method.providerLabel === "Param Sanal POS"
          ? { ...method, active: false, provider: "", providerLabel: "Entegrasyon gerekli" }
          : method
      )
    : defaultPaymentMethodsList

  return {
    ...defaultCommerceSettings,
    ...stored,
    shipping_ranges: stored.shipping_ranges ?? legacyShippingRanges(stored.shipping_methods ?? defaultCommerceSettings.shipping_methods),
    bank_name:
      legacyDemoIbans.has(normalizedIban(stored.bank_iban)) ? "" : stored.bank_name || "",
    bank_iban:
      legacyDemoIbans.has(normalizedIban(stored.bank_iban)) ? "" : stored.bank_iban || "",
    bank_account_name:
      legacyDemoIbans.has(normalizedIban(stored.bank_iban))
        ? ""
        : stored.bank_account_name || "",
    bank_accounts: cleanedAccounts,
    payment_methods_list: cleanedPaymentMethods,
    monthly_transfer_total:
      stored.monthly_transfer_total === "₺128.450,00"
        ? ""
        : stored.monthly_transfer_total || "",
  }
}

export async function saveCommerceSettings(value: CommerceSettings) {
  await ensureCommerceSchema()
  await query(
    `INSERT INTO store_setting (key,value) VALUES ('commerce',$1)
     ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,
    [value]
  )
  return value
}
