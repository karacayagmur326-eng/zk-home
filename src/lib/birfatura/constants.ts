/**
 * BirFatura Entegrasyon Sabitleri ve Eşleştirme Tanımları
 */

import { BirFaturaOrderStatusItem, BirFaturaPaymentMethodItem } from "./types"

/**
 * 1. BirFatura Sipariş Durumları
 *
 * NOT / TODO:
 * BirFatura Swagger dokümanındaki `orderCargoUpdate` örneğinde `orderStatusId: 3` kargolandı olarak
 * verilmişken, `orderStatus` tanımında 2 = Kargolandı, 3 = İptal Edildi olarak listelenmektedir.
 * Bu çelişki nedeniyle callback işlerken doğrudan orderStatusId'ye güvenilerek sipariş iptal edilmemeli,
 * kargo takip kodu ve kargo firması esas alınarak sipariş "shipped" durumuna getirilmelidir.
 */
export const BIRFATURA_ORDER_STATUS_LIST: BirFaturaOrderStatusItem[] = [
  { Id: 1, Value: "Onaylandı" },
  { Id: 2, Value: "Kargolandı" },
  { Id: 3, Value: "İptal Edildi" },
]

/**
 * 2. BirFatura Ödeme Yöntemleri
 */
export const BIRFATURA_PAYMENT_METHODS_LIST: BirFaturaPaymentMethodItem[] = [
  { Id: 1, Value: "Kredi Kartı" },
  { Id: 2, Value: "Banka EFT-Havale" },
  { Id: 3, Value: "Kapıda Ödeme Nakit" },
  { Id: 4, Value: "Kapıda Ödeme Kredi Kartı" },
  { Id: 5, Value: "iyzico" },
]

/**
 * Sistemimizdeki payment provider_id değerlerini BirFatura PaymentMethod ID ve Adına eşler.
 */
export function mapSystemPaymentToBirFatura(providerId?: string | null): { id: number; name: string } {
  const p = (providerId || "").toLowerCase().trim()

  if (p.includes("iyzico")) {
    return { id: 5, name: "iyzico" }
  }
  if (p.includes("bank") || p.includes("transfer") || p.includes("havale") || p.includes("eft")) {
    return { id: 2, name: "Banka EFT-Havale" }
  }
  if (p.includes("cash_on_delivery") || p.includes("kapida") || p.includes("cod")) {
    return { id: 3, name: "Kapıda Ödeme Nakit" }
  }
  if (p.includes("stripe") || p.includes("card") || p.includes("kredi") || p === "pp_system_default") {
    return { id: 1, name: "Kredi Kartı" }
  }

  // Varsayılan Kredi Kartı
  return { id: 1, name: "Kredi Kartı" }
}

/**
 * BirFatura orderStatusId filtresine karşılık gelen SQL durum sorgu koşullarını döner.
 * YALNIZCA ödenmiş veya faturalandırılabilir siparişler dahil edilir!
 */
export function getSqlConditionsForBirFaturaStatus(statusId?: number): {
  statusCondition: string
  params: unknown[]
} {
  // Yalnızca başarılı / ödenmiş siparişler
  const paidCondition = `(o.payment_status IN ('captured', 'paid', 'completed') OR o.status IN ('processing', 'shipped', 'completed', 'delivered'))`

  if (statusId === 1) {
    // 1 = Onaylandı / Hazırlanıyor (ve kargolansa da fatura kesilmesi gerekenler)
    return {
      statusCondition: `o.status NOT IN ('cancelled', 'failed', 'refunded') AND ${paidCondition}`,
      params: [],
    }
  }

  if (statusId === 2) {
    // 2 = Kargolandı
    return {
      statusCondition: `(o.status = 'shipped' OR o.fulfillment_status = 'shipped') AND ${paidCondition}`,
      params: [],
    }
  }

  if (statusId === 3) {
    // 3 = İptal Edildi
    return {
      statusCondition: `o.status IN ('cancelled', 'refunded')`,
      params: [],
    }
  }

  // Filtre verilmemişse tüm faturalandırılabilir siparişler (İptal edilmemiş ve ödemesi alınmış)
  return {
    statusCondition: `o.status NOT IN ('cancelled', 'failed', 'refunded') AND ${paidCondition}`,
    params: [],
  }
}
