/**
 * BirFatura Özel Entegrasyon Tip Tanımları
 */

export interface BirFaturaOrderStatusItem {
  Id: number
  Value: string
}

export interface BirFaturaOrderStatusResponse {
  OrderStatus: BirFaturaOrderStatusItem[]
}

export interface BirFaturaPaymentMethodItem {
  Id: number
  Value: string
}

export interface BirFaturaPaymentMethodsResponse {
  PaymentMethods: BirFaturaPaymentMethodItem[]
}

export interface BirFaturaVariant {
  Type: string
  Value: string
}

export interface BirFaturaExtraFee {
  FeeType: string
  FeeAmountTaxExcluding: number
  FeeAmountTaxIncluding: number
  VatRate?: number
}

export interface BirFaturaOrderDetail {
  ProductId: number
  ProductCode: string
  Barcode: string
  ProductBrand: string
  ProductName: string
  ProductNote: string
  ProductImage: string
  Variants: BirFaturaVariant[]
  ProductQuantityType: string
  ProductQuantity: number
  VatRate: number
  ProductUnitPriceTaxExcluding: number
  ProductUnitPriceTaxIncluding: number
  CommissionUnitTaxExcluding: number
  CommissionUnitTaxIncluding: number
  DiscountUnitTaxExcluding: number
  DiscountUnitTaxIncluding: number
  ExtraFeesUnit: BirFaturaExtraFee[]
}

export interface BirFaturaOrder {
  OrderId: number
  OrderCode: string
  OrderDate: string

  CustomerId?: number

  BillingName: string
  BillingAddress: string
  BillingTown: string
  BillingCity: string
  BillingMobilePhone: string
  BillingPhone: string
  SSNTCNo: string
  TaxOffice: string
  TaxNo: string
  Email: string

  ShippingId: number
  ShippingName: string
  ShippingAddress: string
  ShippingTown: string
  ShippingCity: string
  ShippingCountry: string
  ShippingZipCode: string
  ShippingPhone: string

  ShipCompany: string
  CargoCampaignCode: string

  DeliveryFeeType: number

  SalesChannelWebSite: string

  PaymentTypeId: number
  PaymentType: string

  Currency: string
  CurrencyRate: number

  TotalPaidTaxExcluding: number
  TotalPaidTaxIncluding: number

  ProductsTotalTaxExcluding: number
  ProductsTotalTaxIncluding: number

  CommissionTotalTaxExcluding: number
  CommissionTotalTaxIncluding: number

  ShippingChargeTotalTaxExcluding: number
  ShippingChargeTotalTaxIncluding: number

  PayingAtTheDoorChargeTotalTaxExcluding: number
  PayingAtTheDoorChargeTotalTaxIncluding: number

  DiscountTotalTaxExcluding: number
  DiscountTotalTaxIncluding: number

  InstallmentChargeTotalTaxExcluding: number
  InstallmentChargeTotalTaxIncluding: number

  BankTransferDiscountTotalTaxExcluding: number
  BankTransferDiscountTotalTaxIncluding: number

  ExtraFees: BirFaturaExtraFee[]

  OrderDetails: BirFaturaOrderDetail[]
}

export interface BirFaturaOrdersResponse {
  Orders: BirFaturaOrder[]
}

export interface BirFaturaOrdersRequest {
  orderStatusId?: number
  startDateTime?: string // dd.MM.yyyy HH:mm:ss
  endDateTime?: string // dd.MM.yyyy HH:mm:ss
}

export interface BirFaturaCargoUpdateRequest {
  orderId: number
  orderStatusId: number
  cargoTrackingCode: string
  updateDateTime?: string
  cargoTrackingCodeUrl?: string
  cargoCompany?: string
}

export interface BirFaturaInvoiceLinkUpdateRequest {
  faturaUrl: string
  orderId: number
  faturaTarihi?: string
  faturaNo?: string
}
