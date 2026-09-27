import { BirFaturaOrder, BirFaturaOrderDetail } from "./types"
import { mapSystemPaymentToBirFatura } from "./constants"
import { formatBirFaturaDate } from "./schemas"

interface RawAddress {
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  phone?: string
  country_code?: string
  tax_id?: string
  tax_number?: string
  tax_office?: string
  ssn?: string
  tc_no?: string
  metadata?: Record<string, any>
}

interface RawOrderItem {
  id: string
  birfatura_product_id?: number
  product_id?: string
  variant_id?: string
  title?: string
  thumbnail?: string
  sku?: string
  barcode?: string
  quantity: number
  unit_price: number | string // Kuruş cinsinden
  total: number | string // Kuruş cinsinden
  metadata?: Record<string, any>
  variant?: {
    id?: string
    title?: string
    sku?: string
    barcode?: string
    metadata?: Record<string, any>
  }
  product?: {
    id?: string
    title?: string
    brand?: string
    metadata?: Record<string, any>
  }
}

export interface RawOrder {
  id: string
  birfatura_customer_id?: number
  display_id: number | string
  customer_id?: string | null
  customer_phone?: string | null
  email: string
  status: string
  payment_status?: string
  fulfillment_status?: string
  currency_code?: string
  subtotal: number | string
  shipping_total: number | string
  discount_total?: number | string
  tax_total?: number | string
  total: number | string
  shipping_address?: RawAddress | string | null
  billing_address?: RawAddress | string | null
  shipping_carrier?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
  metadata?: Record<string, any> | string | null
  payment_provider_id?: string | null
  created_at: string | Date
  items?: RawOrderItem[]
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value) return fallback
  if (typeof value === "object") return value as T
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return fallback
}

/**
 * BirFatura formatında sipariş nesnesi üretir.
 */
export function mapOrderToBirFatura(
  order: RawOrder,
  defaultVatRate = 20,
  websiteUrl = "https://www.zk-home.com"
): BirFaturaOrder {
  const shippingAddr = parseJsonField<RawAddress>(order.shipping_address, {})
  const billingAddr = parseJsonField<RawAddress>(order.billing_address, {})
  const orderMeta = parseJsonField<Record<string, any>>(order.metadata, {})
  const billingPhone = [billingAddr.phone, shippingAddr.phone, order.customer_phone]
    .map(value => String(value || "").trim()).find(Boolean) || ""

  const displayId = Number(order.display_id)
  if (!Number.isSafeInteger(displayId) || displayId <= 0) {
    throw new Error("BIRFATURA_INVALID_ORDER_ID")
  }
  if (order.customer_id && (!Number.isSafeInteger(order.birfatura_customer_id) || Number(order.birfatura_customer_id) <= 0)) {
    throw new Error("BIRFATURA_INVALID_CUSTOMER_ID")
  }

  // İsim ve soyisim birleştirme
  const shippingFullName = [shippingAddr.first_name, shippingAddr.last_name].filter(Boolean).join(" ").trim() || "Müşteri"
  const billingFullName = billingAddr.company?.trim() || [billingAddr.first_name, billingAddr.last_name].filter(Boolean).join(" ").trim() || shippingFullName

  const shippingStreet = [shippingAddr.address_1, shippingAddr.address_2].filter(Boolean).join(" ").trim() || "Adres bilgisi girilmedi"
  const billingStreet = [billingAddr.address_1, billingAddr.address_2].filter(Boolean).join(" ").trim() || shippingStreet

  const checkoutTaxNumber = String(billingAddr.tax_number || billingAddr.metadata?.tax_number || orderMeta.tax_number || "").trim()
  const tcNoRaw = String(
    billingAddr.tc_no ||
    (checkoutTaxNumber.length === 11 ? checkoutTaxNumber : "") ||
    billingAddr.tax_id ||
    billingAddr.ssn ||
    billingAddr.metadata?.tc_no ||
    orderMeta.tc_no ||
    orderMeta.tax_id ||
    ""
  ).trim()

  const taxOffice = String(
    billingAddr.tax_office ||
    billingAddr.metadata?.tax_office ||
    orderMeta.tax_office ||
    ""
  ).trim()

  const taxNo = String(
    (checkoutTaxNumber.length === 10 ? checkoutTaxNumber : "") ||
    billingAddr.tax_id ||
    billingAddr.metadata?.tax_no ||
    orderMeta.tax_no ||
    ""
  ).trim()

  // Preserve the existing individual-customer fallback only when no identity is supplied.
  const finalTcNo = (!tcNoRaw && !taxNo) ? "11111111111" : tcNoRaw

  // Ödeme yöntemi eşleştirme
  const paymentProvider = order.payment_provider_id || orderMeta.payment_provider_id || "pp_iyzico_iyzico"
  const paymentInfo = mapSystemPaymentToBirFatura(paymentProvider)

  // Tutarları kuruş -> TL dönüştür (2 ondalık hassasiyet)
  const totalCents = Number(order.total) || 0
  const subtotalCents = Number(order.subtotal) || 0
  const taxTotalCents = Number(order.tax_total) || 0
  const shippingCents = Number(order.shipping_total) || 0
  const discountCents = Number(order.discount_total) || 0

  const totalPaidTL = Number((totalCents / 100).toFixed(2))
  const subtotalTL = Number((subtotalCents / 100).toFixed(2))
  const taxTotalTL = Number((taxTotalCents / 100).toFixed(2))
  const shippingTL = Number((shippingCents / 100).toFixed(2))
  const discountTL = Number((discountCents / 100).toFixed(2))

  // Ürün kalemlerini dönüştür
  const items = Array.isArray(order.items) ? order.items : []
  const orderDetails: BirFaturaOrderDetail[] = items.map((item, index) => {
    if (!Number.isSafeInteger(item.birfatura_product_id) || Number(item.birfatura_product_id) <= 0) {
      throw new Error("BIRFATURA_INVALID_PRODUCT_ID")
    }
    const itemMeta = parseJsonField<Record<string, any>>(item.metadata, {})
    const variantMeta = parseJsonField<Record<string, any>>(item.variant?.metadata, {})
    const productMeta = parseJsonField<Record<string, any>>(item.product?.metadata, {})

    // KDV Oranı Öncelik Sırası:
    // 1. Kalem metadata'sı
    // 2. Varyant veya ürün metadata'sı
    // 3. Mağaza genel KDV oranı (defaultVatRate)
    const rawVatRate =
      itemMeta.vat_rate ??
      itemMeta.tax_rate ??
      variantMeta.vat_rate ??
      productMeta.vat_rate ??
      defaultVatRate

    const vatRate = Number(rawVatRate) >= 0 ? Number(rawVatRate) : 20

    const unitPriceCents = Number(item.unit_price) || 0
    const unitPriceTL = Number((unitPriceCents / 100).toFixed(2))

    // KDV Dahil ve KDV Hariç birim fiyat
    const unitPriceTaxIncluding = unitPriceTL
    const unitPriceTaxExcluding = Number((unitPriceTaxIncluding / (1 + vatRate / 100)).toFixed(4))

    const quantity = Math.max(1, Number(item.quantity) || 1)

    // Varyant bilgisi
    const variantTitle = item.variant?.title || itemMeta.variant_title || "Standart"
    const variants = variantTitle && variantTitle !== "Standart"
      ? [{ Type: "Seçenek", Value: variantTitle }]
      : []

    // Barkod & SKU
    const barcode = item.barcode || item.variant?.barcode || variantMeta.barcode || ""
    const sku = item.sku || item.variant?.sku || item.product_id || `SKU-${displayId}-${index + 1}`

    // Resim URL
    const rawImage = item.thumbnail || productMeta.thumbnail || ""
    const imageUrl = rawImage.startsWith("http")
      ? rawImage
      : rawImage
      ? `${websiteUrl.replace(/\/$/, "")}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`
      : ""

    const brand = item.product?.brand || productMeta.brand || "ZK Home"

    return {
      ProductId: item.birfatura_product_id!,
      ProductCode: sku,
      Barcode: barcode,
      ProductBrand: brand,
      ProductName: item.title || "Ürün",
      ProductNote: itemMeta.note || "",
      ProductImage: imageUrl,
      Variants: variants,
      ProductQuantityType: "Adet",
      ProductQuantity: quantity,
      VatRate: vatRate,
      ProductUnitPriceTaxExcluding: unitPriceTaxExcluding,
      ProductUnitPriceTaxIncluding: unitPriceTaxIncluding,
      CommissionUnitTaxExcluding: 0,
      CommissionUnitTaxIncluding: 0,
      DiscountUnitTaxExcluding: 0,
      DiscountUnitTaxIncluding: 0,
      ExtraFeesUnit: [],
    }
  })

  // Ürünlerin toplam KDV hariç tutarını kalemlerden topla
  const productsTotalTaxExcluding = Number(
    orderDetails
      .reduce((sum, d) => sum + d.ProductUnitPriceTaxExcluding * d.ProductQuantity, 0)
      .toFixed(2)
  )

  const totalPaidTaxExcluding = Number(
    Math.max(0, totalPaidTL - taxTotalTL).toFixed(2)
  )

  return {
    OrderId: displayId,
    OrderCode: String(displayId),
    OrderDate: formatBirFaturaDate(order.created_at),

    // Optional for guests; never substitute an unrelated order ID as a customer ID.
    ...(order.birfatura_customer_id ? { CustomerId: order.birfatura_customer_id } : {}),

    BillingName: billingFullName,
    BillingAddress: billingStreet,
    BillingTown: billingAddr.province || billingAddr.city || "Merkez",
    BillingCity: billingAddr.city || "İstanbul",
    BillingMobilePhone: billingPhone,
    BillingPhone: billingPhone,
    SSNTCNo: finalTcNo,
    TaxOffice: taxOffice,
    TaxNo: taxNo,
    Email: order.email || "",

    ShippingId: displayId,
    ShippingName: shippingFullName,
    ShippingAddress: shippingStreet,
    ShippingTown: shippingAddr.province || shippingAddr.city || "Merkez",
    ShippingCity: shippingAddr.city || "İstanbul",
    ShippingCountry: shippingAddr.country_code?.toUpperCase() === "TR" || !shippingAddr.country_code ? "Türkiye" : shippingAddr.country_code,
    ShippingZipCode: shippingAddr.postal_code || "",
    ShippingPhone: shippingAddr.phone || "",

    ShipCompany: order.shipping_carrier || "",
    CargoCampaignCode: "",

    DeliveryFeeType: 0,

    SalesChannelWebSite: websiteUrl,

    PaymentTypeId: paymentInfo.id,
    PaymentType: paymentInfo.name,

    Currency: (order.currency_code || "TRY").toUpperCase(),
    CurrencyRate: 1,

    TotalPaidTaxExcluding: totalPaidTaxExcluding,
    TotalPaidTaxIncluding: totalPaidTL,

    ProductsTotalTaxExcluding: productsTotalTaxExcluding,
    ProductsTotalTaxIncluding: subtotalTL,

    CommissionTotalTaxExcluding: 0,
    CommissionTotalTaxIncluding: 0,

    ShippingChargeTotalTaxExcluding: shippingTL > 0 ? Number((shippingTL / (1 + defaultVatRate / 100)).toFixed(2)) : 0,
    ShippingChargeTotalTaxIncluding: shippingTL,

    PayingAtTheDoorChargeTotalTaxExcluding: 0,
    PayingAtTheDoorChargeTotalTaxIncluding: 0,

    DiscountTotalTaxExcluding: discountTL > 0 ? Number((discountTL / (1 + defaultVatRate / 100)).toFixed(2)) : 0,
    DiscountTotalTaxIncluding: discountTL,

    InstallmentChargeTotalTaxExcluding: 0,
    InstallmentChargeTotalTaxIncluding: 0,

    BankTransferDiscountTotalTaxExcluding: 0,
    BankTransferDiscountTotalTaxIncluding: 0,

    ExtraFees: [],

    OrderDetails: orderDetails,
  }
}
