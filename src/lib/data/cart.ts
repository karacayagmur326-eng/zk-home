"use server"

import { cache } from "react"
import { HttpTypes } from "@medusajs/types"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId } from "@lib/commerce/repository"
import { getCommerceSettings } from "@lib/commerce/settings"
import { buildShippingOptions, selectedShippingOption } from "@lib/commerce/shipping"
import { revalidateTag } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createHash } from "crypto"
import { convertToLocale } from "@lib/util/money"
import {
  createStripeIntent,
  retrieveStripeIntent,
  stripeEnabled,
} from "@lib/payments/stripe"
import {
  initializeIyzicoCheckout,
  retrieveIyzicoCheckout,
} from "@lib/payments/iyzico"
import {
  getCustomerSessionId,
  setRecentOrderAccess,
} from "@lib/commerce/customer-auth"
import {
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { processNotificationOutbox } from "@lib/notifications/outbox"

async function refreshCart() {
  const tag = await getCacheTag("carts")
  if (tag) revalidateTag(tag)
}

async function releaseExpiredInventoryReservations() {
  await query(
    `WITH released AS (
       UPDATE store_inventory_reservation
       SET status='released',updated_at=NOW()
       WHERE status='active' AND expires_at<=NOW()
       RETURNING variant_id,quantity
     ), totals AS (
       SELECT variant_id,SUM(quantity)::integer AS quantity
       FROM released GROUP BY variant_id
     )
     UPDATE store_variant v
     SET stock=v.stock+totals.quantity,updated_at=NOW()
     FROM totals WHERE v.id=totals.variant_id`
  )
}

export async function releaseCartInventoryReservation(cartId: string) {
  const activeRes = await query<{ id: string }>(
    `SELECT id FROM store_inventory_reservation WHERE cart_id=$1 AND status='active' LIMIT 1`,
    [cartId]
  ).catch(() => [])

  if (!activeRes.length) {
    await query(
      `UPDATE store_cart
       SET metadata=(COALESCE(metadata,'{}'::jsonb)
         - 'payment_provider_id' - 'payment_data'),updated_at=NOW()
       WHERE id=$1 AND completed_at IS NULL AND (metadata ? 'payment_provider_id' OR metadata ? 'payment_data')`,
      [cartId]
    ).catch(() => {})
    return
  }

  await withTransaction(async (client) => {
    await client.query(
      `WITH released AS (
         UPDATE store_inventory_reservation
         SET status='released',updated_at=NOW()
         WHERE cart_id=$1 AND status='active'
         RETURNING variant_id,quantity
       ), totals AS (
         SELECT variant_id,SUM(quantity)::integer AS quantity
         FROM released GROUP BY variant_id
       )
       UPDATE store_variant v
       SET stock=v.stock+totals.quantity,updated_at=NOW()
       FROM totals WHERE v.id=totals.variant_id`,
      [cartId]
    )
    await client.query(
      `UPDATE store_cart
       SET metadata=(COALESCE(metadata,'{}'::jsonb)
         - 'payment_provider_id' - 'payment_data'),updated_at=NOW()
       WHERE id=$1 AND completed_at IS NULL`,
      [cartId]
    )
  })
}

async function reserveCartInventory(cartId: string) {
  await releaseExpiredInventoryReservations()
  await withTransaction(async (client) => {
    const cart = await client.query(
      `SELECT id FROM store_cart
       WHERE id=$1 AND completed_at IS NULL FOR UPDATE`,
      [cartId]
    )
    if (!cart.rowCount) throw new Error("Sepet bulunamadı.")

    const existing = await client.query(
      `SELECT id FROM store_inventory_reservation
       WHERE cart_id=$1 AND status='active' AND expires_at>NOW()
       FOR UPDATE`,
      [cartId]
    )
    if (existing.rowCount) {
      await client.query(
        `UPDATE store_inventory_reservation
         SET expires_at=NOW()+INTERVAL '2 hours',updated_at=NOW()
         WHERE cart_id=$1 AND status='active'`,
        [cartId]
      )
      return
    }

    const items = await client.query<{
      variant_id: string
      quantity: number
      title: string
      stock: number
      manage_inventory: boolean
      allow_backorder: boolean
    }>(
      `SELECT ci.variant_id,ci.quantity,p.title,v.stock,
              v.manage_inventory,v.allow_backorder
       FROM store_cart_item ci
       JOIN store_variant v ON v.id=ci.variant_id
       JOIN store_product p ON p.id=v.product_id
       WHERE ci.cart_id=$1
       FOR UPDATE OF v`,
      [cartId]
    )
    if (!items.rows.length) throw new Error("Sepet boş.")

    for (const item of items.rows) {
      if (!item.manage_inventory) continue
      if (!item.allow_backorder && Number(item.stock) < item.quantity) {
        throw new Error(
          `${item.title} için yeterli stok bulunmuyor. Sepetinizi güncelleyin.`
        )
      }
      await client.query(
        `UPDATE store_variant
         SET stock=stock-$2,updated_at=NOW() WHERE id=$1`,
        [item.variant_id, item.quantity]
      )
      await client.query(
        `INSERT INTO store_inventory_reservation
         (id,cart_id,variant_id,quantity,status,expires_at)
         VALUES ($1,$2,$3,$4,'active',NOW()+INTERVAL '2 hours')`,
        [createId("reserve"), cartId, item.variant_id, item.quantity]
      )
    }
  })
}

export async function acceptCheckoutTerms(cartId: string) {
  const cookieCartId = await getCartId()
  if (!cookieCartId || cookieCartId !== cartId) {
    throw new Error("Sepet oturumu doğrulanamadı.")
  }
  const pages = await query<{ handle: string; content: unknown }>(
    `SELECT handle,content FROM content_pages
     WHERE handle IN ('on-bilgilendirme-formu','mesafeli-satis-sozlesmesi')`
  ).catch(() => [])

  const documents: Record<string, string> = {}
  pages.forEach((page) => {
    documents[page.handle] = createHash("sha256")
      .update(JSON.stringify(page.content || {}))
      .digest("hex")
  })

  if (!documents["on-bilgilendirme-formu"]) {
    documents["on-bilgilendirme-formu"] = createHash("sha256").update("zkhome-pro-on-bilgilendirme").digest("hex")
  }
  if (!documents["mesafeli-satis-sozlesmesi"]) {
    documents["mesafeli-satis-sozlesmesi"] = createHash("sha256").update("zkhome-pro-mesafeli-satis").digest("hex")
  }

  await query(
    `UPDATE store_cart
     SET metadata=COALESCE(metadata,'{}'::jsonb) ||
       jsonb_build_object(
         'legal_acceptance',
         jsonb_build_object(
           'accepted_at',NOW(),
           'documents',$2::jsonb
         )
       ),
       updated_at=NOW()
     WHERE id=$1 AND completed_at IS NULL`,
    [cartId, documents]
  )
  await refreshCart()
}

async function shapeCart(id: string) {
  await ensureCommerceSchema()
  await releaseExpiredInventoryReservations()
  await query(
    `DELETE FROM store_cart_item ci
     WHERE ci.cart_id=$1 AND NOT EXISTS (
       SELECT 1 FROM store_variant v
       JOIN store_product p ON p.id=v.product_id
       WHERE v.id=ci.variant_id AND p.status='published'
     )`,
    [id]
  )
  await query(
    `UPDATE store_cart_item ci
     SET unit_price=v.price,updated_at=NOW()
     FROM store_variant v
     WHERE ci.cart_id=$1 AND ci.variant_id=v.id
       AND ci.unit_price<>v.price`,
    [id]
  )
  const carts = await query<any>(
    `SELECT * FROM store_cart WHERE id=$1 AND completed_at IS NULL LIMIT 1`,
    [id]
  )
  const cart = carts[0]
  if (!cart) return null
  const items = await query<any>(
    `SELECT ci.id,ci.quantity,ci.unit_price,
            v.id AS variant_id,v.title AS variant_title,v.sku,v.barcode,
            v.stock,v.allow_backorder,v.manage_inventory,
            p.id AS product_id,p.title,p.handle,p.description,p.subtitle,
            COALESCE(v.thumbnail,p.thumbnail) AS thumbnail,p.metadata
     FROM store_cart_item ci
     JOIN store_variant v ON v.id=ci.variant_id
     JOIN store_product p ON p.id=v.product_id
     WHERE ci.cart_id=$1
     ORDER BY ci.created_at`,
    [id]
  )
  const shapedItems = items.map((item) => {
    const unitPrice = Number(item.unit_price || 0)
    const total = unitPrice * Number(item.quantity)
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      thumbnail: item.thumbnail,
      quantity: Number(item.quantity),
      unit_price: unitPrice,
      subtotal: total,
      total,
      original_total: total,
      original_unit_price: unitPrice,
      variant_id: item.variant_id,
      product_id: item.product_id,
      product_handle: item.handle,
      metadata: {},
      product: {
        id: item.product_id,
        title: item.title,
        handle: item.handle,
        description: item.description,
        subtitle: item.subtitle,
        thumbnail: item.thumbnail,
        metadata: item.metadata || {},
      },
      variant: {
        id: item.variant_id,
        product_id: item.product_id,
        title: item.variant_title,
        sku: item.sku,
        barcode: item.barcode,
        inventory_quantity: Number(item.stock),
        allow_backorder: item.allow_backorder,
        manage_inventory: item.manage_inventory,
        calculated_price: {
          calculated_amount: unitPrice,
          original_amount: unitPrice,
          currency_code: "try",
        },
      },
    }
  })
  const subtotal = shapedItems.reduce((sum, item) => sum + item.total, 0)
  const shippingSettings = await getCommerceSettings()
  const selectedShipping = selectedShippingOption(subtotal, shippingSettings.shipping_methods, cart.shipping_method)
  const shippingTotal = selectedShipping?.amount || 0
  const paymentProviderId = cart.metadata?.payment_provider_id
  const paymentData = cart.metadata?.payment_data || {}

  let discountTotal = 0
  let promotions: any[] = []

  const cartMeta = typeof cart.metadata === "string"
    ? JSON.parse(cart.metadata || "{}")
    : (cart.metadata || {})
  const promoCode = cartMeta?.promo_code

  if (promoCode) {
    try {
      const couponRows = await query<any>(
        `SELECT * FROM store_coupon
         WHERE UPPER(code) = UPPER($1)
           AND is_active = TRUE
           AND (starts_at IS NULL OR starts_at <= NOW())
           AND (ends_at IS NULL OR ends_at >= NOW())
           AND (usage_limit IS NULL OR usage_count < usage_limit)
         LIMIT 1`,
        [String(promoCode).trim()]
      )
      const coupon = couponRows?.[0]
      if (coupon) {
        const minSub = Number(coupon.min_subtotal) || 0
        if (subtotal >= minSub) {
          if (coupon.type === "percentage") {
            discountTotal = Math.round((subtotal * Number(coupon.value)) / 100)
          } else {
            discountTotal = Math.min(subtotal, Number(coupon.value))
          }
          promotions = [
            {
              id: coupon.id,
              code: coupon.code,
              is_automatic: false,
              application_method: {
                type: coupon.type,
                value: Number(coupon.value),
                currency_code: "try",
              },
            },
          ]
        }
      }
    } catch (err) {
      console.error("Coupon query error:", err)
    }
  }

  const commerceSettings = shippingSettings
  const codFee =
    paymentProviderId === "cash_on_delivery" &&
    commerceSettings.payment_methods.cashOnDelivery &&
    commerceSettings.cod_fee_active
      ? Math.max(0, Number(commerceSettings.cod_fee_amount || 0))
      : 0
  const taxableTotal = Math.max(0, subtotal - discountTotal)
  const vatRate = Math.max(
    0,
    Math.min(Number(commerceSettings.tax_settings.vatRate || 0), 100)
  )
  const taxTotal = commerceSettings.tax_settings.includeVat
    ? Math.round((taxableTotal * vatRate) / (100 + vatRate || 1))
    : Math.round((taxableTotal * vatRate) / 100)
  const finalTotal = Math.max(
    0,
    taxableTotal +
      shippingTotal +
      codFee +
      (commerceSettings.tax_settings.includeVat ? 0 : taxTotal)
  )

  return {
    id: cart.id,
    region_id: "region_tr",
    currency_code: cart.currency_code || "try",
    email: cart.email,
    customer_id: cart.customer_id,
    metadata: {
      ...cartMeta,
      payment_fee: codFee,
      payment_fee_label: codFee ? "Kapıda ödeme hizmet bedeli" : null,
    },
    shipping_address: cart.shipping_address,
    billing_address: cart.billing_address,
    items: shapedItems,
    item_total: subtotal,
    original_item_total: subtotal,
    subtotal,
    shipping_total: shippingTotal,
    tax_total: taxTotal,
    discount_total: discountTotal,
    gift_card_total: 0,
    total: finalTotal,
    original_total: subtotal + shippingTotal + codFee,
    promotions,
    shipping_methods: selectedShipping ? [selectedShipping] : [],
    payment_collection: {
      id: `paycol_${cart.id}`,
      status: "not_paid",
      payment_sessions: paymentProviderId
        ? [
            {
              id: `payses_${cart.id}`,
              provider_id: paymentProviderId,
              status: "pending",
              data: paymentData,
            },
          ]
        : [],
    },
    region: {
      id: "region_tr",
      name: "Türkiye",
      currency_code: "try",
      countries: [{ iso_2: "tr", display_name: "Türkiye" }],
    },
    created_at: cart.created_at,
    updated_at: cart.updated_at,
  } as unknown as HttpTypes.StoreCart
}

const retrieveCartOnce = cache(async (cartId?: string) => {
  const id = cartId || (await getCartId())
  if (!id) return null

  let cart = await shapeCart(id)
  if (!cart) return null

  const customerId = await getCustomerSessionId().catch(() => null)
  if (customerId && (!cart.customer_id || cart.customer_id !== customerId)) {
    const cust = await query<any>(`SELECT email FROM store_customer WHERE id=$1`, [customerId])
    if (cust && cust[0]) {
      await query(
        `UPDATE store_cart SET customer_id=$2, email=COALESCE(email, $3), updated_at=NOW() WHERE id=$1 AND completed_at IS NULL`,
        [id, customerId, cust[0].email]
      )
      cart = await shapeCart(id)
    }
  }

  return cart
})

export async function retrieveCart(cartId?: string) {
  return retrieveCartOnce(cartId)
}

export async function getOrSetCart(_countryCode = "tr") {
  let cart = await retrieveCart()
  if (cart) return cart

  await ensureCommerceSchema()
  const id = createId("cart")
  const customerId = await getCustomerSessionId().catch(() => null)
  let emailVal: string | null = null
  if (customerId) {
    const cust = await query<any>(`SELECT email FROM store_customer WHERE id=$1`, [customerId])
    emailVal = cust[0]?.email || null
  }

  await query(
    `INSERT INTO store_cart (id, customer_id, email) VALUES ($1, $2, $3)`,
    [id, customerId || null, emailVal]
  )
  await setCartId(id)
  await refreshCart()
  cart = await shapeCart(id)
  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const id = await getCartId()
  if (!id) throw new Error("Mevcut sepet bulunamadı.")
  await ensureCommerceSchema()
  await query(
    `UPDATE store_cart SET
       email=COALESCE($2,email),
       shipping_address=COALESCE($3,shipping_address),
       billing_address=COALESCE($4,billing_address),
       updated_at=NOW()
     WHERE id=$1`,
    [
      id,
      (data as any).email || null,
      (data as any).shipping_address || null,
      (data as any).billing_address || null,
    ]
  )
  await refreshCart()
  return shapeCart(id)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) throw new Error("Varyant bilgisi eksik.")
  if (!Number.isInteger(quantity) || quantity < 1) return { success: false as const, error: "Geçerli bir ürün adedi seçin." }
  const cookieId = await getCartId()
  const existingCart = cookieId ? await query<{ id: string }>(`SELECT id FROM store_cart WHERE id=$1 AND completed_at IS NULL`, [cookieId]) : []
  const cart = existingCart[0] || await getOrSetCart(countryCode)
  if (!cart) throw new Error("Sepet oluşturulamadı.")
  await releaseCartInventoryReservation(cart.id)
  await releaseExpiredInventoryReservations()
  const result = await withTransaction(async (client) => {
  await client.query(`SELECT id FROM store_cart WHERE id=$1 FOR UPDATE`, [cart.id])
  const variants = await client.query<{ price: string; stock: number; allow_backorder: boolean; manage_inventory: boolean }>(
    `SELECT v.price,v.stock,v.allow_backorder,v.manage_inventory FROM store_variant v JOIN store_product p ON p.id=v.product_id WHERE v.id=$1 AND p.status='published'`,
    [variantId]
  )

  const variant = variants.rows[0]
  if (!variant) throw new Error("Ürün varyantı bulunamadı.")
  const existing = await client.query<{ quantity: number; updated_at: Date | null; created_at: Date | null }>(
    `SELECT quantity, updated_at, created_at FROM store_cart_item WHERE cart_id=$1 AND variant_id=$2`,
    [cart.id, variantId]
  )

  const requestedQuantity = Number(existing.rows[0]?.quantity || 0) + quantity
  if (variant.manage_inventory && !variant.allow_backorder && Number(variant.stock) < requestedQuantity)
    return { success: false as const, error: Number(variant.stock) > 0
      ? `Bu üründen en fazla ${Number(variant.stock)} adet ekleyebilirsiniz. Sepetinizdeki adet korundu.`
      : "Bu ürün şu anda stokta bulunmuyor. Sepetinizdeki adet korundu." }

  await client.query(
    `INSERT INTO store_cart_item (id,cart_id,variant_id,quantity,unit_price)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (cart_id,variant_id) DO UPDATE SET
       quantity=store_cart_item.quantity + EXCLUDED.quantity,
       unit_price=EXCLUDED.unit_price,updated_at=NOW()`,
    [createId("item"), cart.id, variantId, quantity, Number(variant.price)]
  )
  await client.query(`UPDATE store_cart SET updated_at=NOW() WHERE id=$1`, [cart.id])
  return { success: true as const }
  }, { invalidateCatalog: false })
  if (!result.success) return result
  const snapshot = await shapeCart(cart.id)
  return { success: true as const, cart: snapshot, count: snapshot?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0 }
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  const cartId = await getCartId()
  if (!cartId) return { success: false as const, error: "Sepet oturumunuz sona erdi. Sayfayı yenileyip tekrar deneyin." }
  if (!Number.isInteger(quantity)) return { success: false as const, error: "Geçerli bir ürün adedi seçin." }
  await releaseCartInventoryReservation(cartId)
  if (quantity <= 0) return deleteLineItem(lineId)
  const rows = await query<{
    stock: number
    allow_backorder: boolean
    manage_inventory: boolean
  }>(
    `SELECT v.stock,v.allow_backorder,v.manage_inventory
     FROM store_cart_item ci
     JOIN store_variant v ON v.id=ci.variant_id
     WHERE ci.id=$1 AND ci.cart_id=$2`,
    [lineId, cartId]
  )
  const variant = rows[0]
  if (!variant) return { success: false as const, error: "Ürün sepetinizde bulunamadı. Sayfayı yenileyin." }
  if (
    variant.manage_inventory &&
    !variant.allow_backorder &&
    Number(variant.stock) < quantity
  ) {
    return { success: false as const, error: `Bu üründen en fazla ${Number(variant.stock)} adet ekleyebilirsiniz. Sepetinizdeki adet korundu.` }
  }
  await query(
    `UPDATE store_cart_item SET quantity=$3,updated_at=NOW()
     WHERE id=$1 AND cart_id=$2`,
    [lineId, cartId, quantity]
  )
  await query(`UPDATE store_cart SET updated_at=NOW() WHERE id=$1`, [cartId])
  const cart = await shapeCart(cartId)
  return { success: true as const, cart, count: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0 }
}

export async function deleteLineItem(lineId: string) {
  const cartId = await getCartId()
  if (!cartId) throw new Error("Sepet bulunamadı.")
  await releaseCartInventoryReservation(cartId)
  await query(`DELETE FROM store_cart_item WHERE id=$1 AND cart_id=$2`, [
    lineId,
    cartId,
  ])
  await query(`UPDATE store_cart SET updated_at=NOW() WHERE id=$1`, [cartId])
  const cart = await shapeCart(cartId)
  return { success: true as const, cart, count: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0 }
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const cookieCartId = await getCartId()
  if (!cookieCartId || cookieCartId !== cartId) {
    return { success: false as const, error: "Sepet oturumunuz sona erdi. Sayfayı yenileyip tekrar deneyin." }
  }
  await releaseCartInventoryReservation(cartId)
  const option = (await shippingOptions(cartId)).find((item) => item.id === shippingMethodId)
  if (!option) return { success: false as const, error: "Bu teslimat seçeneği artık kullanılamıyor. Başka bir yöntem seçin." }
  await query(
    `UPDATE store_cart SET shipping_method=$2,updated_at=NOW() WHERE id=$1`,
    [cartId, option]
  )
  await refreshCart()
  return { success: true as const }
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const providerId = String(data.provider_id || "")
  if (!providerId) throw new Error("Ödeme yöntemi seçilmedi.")
  const settings = await getCommerceSettings()
  let paymentData: Record<string, unknown> = {}
  const validatedCart = await shapeCart(cart.id)
  if (!validatedCart) throw new Error("Sepet bulunamadı.")
  const acceptedAt = String(
    (validatedCart as any).metadata?.legal_acceptance?.accepted_at || ""
  )
  if (!acceptedAt) {
    throw new Error(
      "Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onaylanmalıdır."
    )
  }
  if (providerId !== "pp_iyzico_iyzico") {
    await releaseCartInventoryReservation(cart.id)
  }
  if (providerId === "pp_stripe_stripe") {
    if (!stripeEnabled()) throw new Error("Kartla ödeme şu anda kullanılamıyor.")
    const intent = await createStripeIntent({
      amount: Number(validatedCart.total || 0),
      currency: validatedCart.currency_code || "try",
      cartId: cart.id,
      email: validatedCart.email,
    })
    paymentData = {
      intent_id: intent.id,
      client_secret: intent.client_secret,
    }
  } else if (providerId === "bank_transfer") {
    if (!settings.payment_methods.bankTransfer) {
      throw new Error("Havale / EFT ödeme yöntemi etkin değil.")
    }
    const account = settings.bank_accounts.find(
      (item) => item.active && item.showInCheckout
    )
    if (!account?.iban || !account.accountHolder) {
      throw new Error("Havale hesabı yönetim panelinde eksiksiz yapılandırılmamış.")
    }
    paymentData = { bank_account_id: account.id }
  } else if (providerId === "cash_on_delivery") {
    if (!settings.payment_methods.cashOnDelivery) {
      throw new Error("Kapıda ödeme yöntemi etkin değil.")
    }
  } else if (providerId === "pp_iyzico_iyzico") {
    const requestHeaders = await headers()
    const ip =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      requestHeaders.get("x-real-ip") ||
      "127.0.0.1"
    await reserveCartInventory(cart.id)
    let checkout
    try {
      checkout = await initializeIyzicoCheckout({
        cart: validatedCart,
        taxNumber:
          (validatedCart as any).metadata?.invoice_type === "kurumsal"
            ? String((validatedCart as any).metadata?.tax_number || "")
            : undefined,
        ip,
      })
    } catch (error) {
      await releaseCartInventoryReservation(cart.id)
      throw error
    }
    paymentData = {
      token: checkout.token,
      conversation_id: checkout.conversationId,
      payment_url: checkout.paymentUrl,
    }
  } else {
    throw new Error("Desteklenmeyen veya yapılandırılmamış ödeme yöntemi.")
  }
  await query(
    `UPDATE store_cart
     SET metadata = COALESCE(metadata, '{}'::jsonb) ||
       jsonb_build_object('payment_provider_id', $2::text, 'payment_data', $3::jsonb),
       updated_at = NOW()
     WHERE id = $1 AND completed_at IS NULL`,
    [cart.id, providerId, paymentData]
  )
  await refreshCart()
  return {
    cart: await shapeCart(cart.id),
    payment_url:
      typeof paymentData.payment_url === "string"
        ? paymentData.payment_url
        : null,
  }
}

export async function applyPromotions(codes: string[]) {
  const id = await getCartId()
  if (!id) throw new Error("Mevcut sepet bulunamadı.")
  await releaseCartInventoryReservation(id)

  await ensureCommerceSchema()
  const code = codes.length > 0 ? String(codes[codes.length - 1] || "").trim().toUpperCase() : ""

  if (!code) {
    // Clear promotion
    await query(
      `UPDATE store_cart SET metadata = COALESCE(metadata, '{}'::jsonb) - 'promo_code', updated_at=NOW() WHERE id=$1`,
      [id]
    )
    await refreshCart()
    return shapeCart(id)
  }

  const couponRows = await query<any>(
    `SELECT * FROM store_coupon
     WHERE UPPER(code) = UPPER($1)
       AND is_active = TRUE
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
       AND (usage_limit IS NULL OR usage_count < usage_limit)
     LIMIT 1`,
    [code]
  )
  const coupon = couponRows[0]

  if (!coupon) {
    throw new Error(`"${code}" adında aktif bir indirim kodu bulunamadı.`)
  }

  const cart = await shapeCart(id)
  const subtotal = cart?.subtotal || 0
  const minSub = Number(coupon.min_subtotal) || 0

  if (subtotal < minSub) {
    throw new Error(
      `Bu indirim kodunu kullanabilmek için minimum sepet tutarı ${convertToLocale({ amount: minSub, currency_code: "TRY" })} olmalıdır.`
    )
  }

  await query(
    `UPDATE store_cart SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('promo_code', $2::text), updated_at=NOW() WHERE id=$1`,
    [id, String(coupon.code)]
  )
  await refreshCart()
  return shapeCart(id)
}

export async function applyGiftCard(_code: string) {}
export async function removeDiscount(_code: string) {}
export async function removeGiftCard(_code: string, _giftCards: any[]) {}

export async function submitPromotionForm(
  _currentState: unknown,
  formData: FormData
) {
  await applyPromotions([String(formData.get("code") || "")])
}

export async function setAddresses(
  _currentState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string } | null> {
  const addressType = String(formData.get("address_type") || "bireysel")
  const sameAsBilling = formData.get("same_as_billing") === "on"
  const billingAddressType = sameAsBilling
    ? addressType
    : String(formData.get("billing_address_type") || "bireysel")
  const taxNumber =
    billingAddressType === "kurumsal"
      ? String(
          formData.get("billing_tax_number") ||
            formData.get("tax_number") ||
            ""
        ).replace(/\D/g, "")
      : ""
  if (billingAddressType === "kurumsal" && !/^\d{10}$/.test(taxNumber)) {
    return { success: false, error: "Kurumsal fatura için 10 haneli vergi numarası gereklidir." }
  }
  const shippingAddress = {
    first_name: formData.get("shipping_address.first_name"),
    last_name: formData.get("shipping_address.last_name"),
    address_1: formData.get("shipping_address.address_1"),
    address_2: formData.get("shipping_address.address_2") || "",
    company: formData.get("shipping_address.company"),
    postal_code: formData.get("shipping_address.postal_code"),
    city: formData.get("shipping_address.city"),
    country_code: "tr",
    province: formData.get("shipping_address.province"),
    phone: formData.get("shipping_address.phone"),
  }
  const billingAddress =
    formData.get("same_as_billing") === "on"
      ? shippingAddress
      : {
          first_name: formData.get("billing_address.first_name"),
          last_name: formData.get("billing_address.last_name"),
          address_1: formData.get("billing_address.address_1"),
          address_2: formData.get("billing_address.address_2") || "",
          company: formData.get("billing_address.company"),
          postal_code: formData.get("billing_address.postal_code"),
          city: formData.get("billing_address.city"),
          country_code: "tr",
          province: formData.get("billing_address.province"),
          phone: formData.get("billing_address.phone"),
        }
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const requiredValues = [
    shippingAddress.first_name,
    shippingAddress.last_name,
    shippingAddress.address_1,
    shippingAddress.city,
    shippingAddress.province,
  ].map((value) => String(value || "").trim())
  if (requiredValues.some((value) => !value)) {
    return { success: false, error: "Teslimat adresindeki zorunlu alanları eksiksiz doldurun." }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Geçerli bir e-posta adresi girin." }
  }
  const settings = await getCommerceSettings()
  const customerId = await getCustomerSessionId().catch(() => null)
  if (!settings.order_settings.guestCheckout && !customerId) {
    return {
      success: false,
      error: "Üyeliksiz sipariş kapalıdır. Teslimat bilgilerini kaydetmek için giriş yapın."
    }
  }
  const phone = String(shippingAddress.phone || "").replace(/\D/g, "")
  if (settings.order_settings.requirePhone && !/^\d{10,11}$/.test(phone)) {
    return { success: false, error: "Geçerli bir telefon numarası girin." }
  }
  if (String(shippingAddress.address_1 || "").trim().length < 10) {
    return { success: false, error: "Teslimat adresi en az 10 karakter olmalıdır (Lütfen caddesini, sokağını ve kapı numarasını eksiksiz yazınız)." }
  }
  if (!sameAsBilling) {
    const billingRequired = [
      billingAddress.first_name,
      billingAddress.last_name,
      billingAddress.address_1,
      billingAddress.city,
      billingAddress.province,
    ].map((value) => String(value || "").trim())
    if (billingRequired.some((value) => !value)) {
      return { success: false, error: "Fatura adresindeki zorunlu alanları eksiksiz doldurun." }
    }
  }
  await updateCart({
    email,
    shipping_address: shippingAddress,
    billing_address: billingAddress,
  } as any)
  const cartId = await getCartId()
  if (!cartId) return { success: false, error: "Sepet bulunamadı." }
  await query(
    `UPDATE store_cart
     SET metadata=COALESCE(metadata,'{}'::jsonb) || $2::jsonb,updated_at=NOW()
     WHERE id=$1 AND completed_at IS NULL`,
    [
      cartId,
      {
        invoice_type: billingAddressType,
        tax_number: taxNumber || null,
        tax_office: String(
          sameAsBilling
            ? formData.get("tax_office") || ""
            : formData.get("billing_tax_office") || ""
        ).trim(),
      },
    ]
  )
  return { success: true }
}

export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())
  if (!id) throw new Error("Sepet bulunamadı.")
  const cart = await shapeCart(id)
  if (!cart || !cart.items?.length) throw new Error("Sepet boş.")
  if (!cart.email) throw new Error("E-posta adresi zorunludur.")
  if (!(cart as any).metadata?.legal_acceptance?.accepted_at) {
    throw new Error(
      "Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onaylanmalıdır."
    )
  }
  const paymentSession = cart.payment_collection?.payment_sessions?.[0]
  const providerId = paymentSession?.provider_id
  if (!providerId) throw new Error("Ödeme yöntemi seçilmedi.")
  const settings = await getCommerceSettings()
  if (
    Number(settings.order_settings.minOrderAmount || 0) > 0 &&
    Number(cart.subtotal || 0) <
      Number(settings.order_settings.minOrderAmount)
  ) {
    throw new Error("Sepet tutarı mağazanın minimum sipariş tutarının altında.")
  }
  if (!cart.shipping_methods?.length) {
    throw new Error("Teslimat yöntemi seçilmelidir.")
  }
  let paymentStatus = "pending"
  let providerReference: string | null = null
  if (providerId === "pp_stripe_stripe") {
    const intentId = String(paymentSession?.data?.intent_id || "")
    if (!intentId) throw new Error("Kart ödeme kaydı bulunamadı.")
    const intent = await retrieveStripeIntent(intentId)
    if (
      !["succeeded", "requires_capture"].includes(intent.status) ||
      intent.amount !== Number(cart.total) ||
      intent.currency.toLowerCase() !== "try"
    ) {
      throw new Error("Kart ödemesi doğrulanamadı.")
    }
    paymentStatus = intent.status === "succeeded" ? "paid" : "authorized"
    providerReference = intent.id
  } else if (providerId === "bank_transfer") {
    if (!settings.payment_methods.bankTransfer) {
      throw new Error("Havale / EFT ödeme yöntemi etkin değil.")
    }
    const accountId = String(paymentSession?.data?.bank_account_id || "")
    const account = settings.bank_accounts.find(
      (item) =>
        item.id === accountId &&
        item.active &&
        item.showInCheckout &&
        Boolean(item.iban) &&
        Boolean(item.accountHolder)
    )
    if (!account) throw new Error("Havale hesabı doğrulanamadı.")
  } else if (providerId === "cash_on_delivery") {
    if (!settings.payment_methods.cashOnDelivery) {
      throw new Error("Kapıda ödeme yöntemi etkin değil.")
    }
  } else if (providerId === "pp_iyzico_iyzico") {
    const token = String(paymentSession?.data?.token || "")
    const conversationId = String(
      paymentSession?.data?.conversation_id || cart.id
    )
    if (!token || conversationId !== cart.id) {
      throw new Error("iyzico ödeme oturumu bulunamadı.")
    }
    const result = await retrieveIyzicoCheckout({
      token,
      conversationId,
    })
    if (
      result.status !== "success" ||
      result.paymentStatus !== "SUCCESS" ||
      Number(result.fraudStatus) === -1 ||
      (result.basketId && result.basketId !== cart.id) ||
      (result.conversationId && result.conversationId !== cart.id) ||
      (result.currency && result.currency.toUpperCase() !== "TRY")
    ) {
      const errorMsg =
        result.errorMessage ||
        "iyzico ödemesi banka veya sağlayıcı tarafından onaylanamadı."
      throw new Error(errorMsg)
    }
    paymentStatus = "paid"
    providerReference = String(result.paymentId || result.itemTransactions?.[0]?.paymentTransactionId || "")
  } else {
    throw new Error("Ödeme doğrulanamadığı için sipariş oluşturulmadı.")
  }
  const orderId = createId("order")
  const orderNotificationId = `notif_order_created_${orderId}`
  const appliedCouponCode = (cart.promotions?.[0] as any)?.code
  await withTransaction(async (client) => {
    const lockedCart = await client.query(
      `SELECT id FROM store_cart
       WHERE id=$1 AND completed_at IS NULL FOR UPDATE`,
      [id]
    )
    if (!lockedCart.rowCount) {
      throw new Error("Bu sepet için sipariş daha önce oluşturulmuş.")
    }
    if (appliedCouponCode) {
      const couponResult = await client.query<{
        type: string
        value: string
        min_subtotal: string
      }>(
        `SELECT type,value,min_subtotal FROM store_coupon
         WHERE UPPER(code)=UPPER($1)
           AND is_active=TRUE
           AND (starts_at IS NULL OR starts_at<=NOW())
           AND (ends_at IS NULL OR ends_at>=NOW())
           AND (usage_limit IS NULL OR usage_count<usage_limit)
         LIMIT 1 FOR UPDATE`,
        [appliedCouponCode]
      )
      const coupon = couponResult.rows[0]
      if (!coupon || Number(cart.subtotal) < Number(coupon.min_subtotal || 0)) {
        throw new Error("İndirim kodu artık kullanılamıyor.")
      }
      const expectedDiscount =
        coupon.type === "percentage"
          ? Math.round(
              (Number(cart.subtotal) *
                Math.max(0, Math.min(Number(coupon.value), 100))) /
                100
            )
          : Math.min(Number(cart.subtotal), Number(coupon.value))
      if (expectedDiscount !== Number(cart.discount_total || 0)) {
        throw new Error("İndirim tutarı değişti. Sepetinizi yenileyin.")
      }
    }
    const reservations = await client.query<{
      variant_id: string
      quantity: number
    }>(
      `SELECT variant_id,quantity FROM store_inventory_reservation
       WHERE cart_id=$1 AND status='active' AND expires_at>NOW()
       FOR UPDATE`,
      [id]
    )
    const reserved = new Map(
      reservations.rows.map((row) => [row.variant_id, Number(row.quantity)])
    )
    for (const item of cart.items || []) {
      const variantId = String(item.variant_id || "")
      if (reserved.has(variantId)) {
        if (reserved.get(variantId) !== Number(item.quantity)) {
          throw new Error("Stok rezervasyonu sepet ile eşleşmiyor.")
        }
        continue
      }
      const inventory = await client.query(
        `UPDATE store_variant
         SET stock = CASE
           WHEN manage_inventory THEN stock - $2
           ELSE stock
         END,
         updated_at = NOW()
         WHERE id = $1
           AND (
             NOT manage_inventory
             OR allow_backorder
             OR stock >= $2
           )
         RETURNING id`,
        [item.variant_id, item.quantity]
      )
      if (!inventory.rowCount) {
        throw new Error(
          `${item.title} için yeterli stok bulunmuyor. Sepetinizi güncelleyin.`
        )
      }
    }
    if (
      providerId === "pp_iyzico_iyzico" &&
      (cart.items || []).some(
        (item) => Boolean(item.variant?.manage_inventory)
      ) &&
      reservations.rows.length === 0
    ) {
      throw new Error(
        "Ödeme oturumunun stok rezervasyonu sona ermiş. Destek ekibiyle iletişime geçin."
      )
    }
    const createdOrder = await client.query<{ display_id: number }>(
      `INSERT INTO store_order
       (id,customer_id,email,status,payment_status,fulfillment_status,
        currency_code,subtotal,shipping_total,discount_total,tax_total,total,
        coupon_code,shipping_address,billing_address,invoice_type,metadata,
        created_at,updated_at)
       VALUES ($1,$2,$3,$11,$12,'not_fulfilled',
        'try',$4,$5,$6,$15,$7,$8,$9,$10,$13,$14,NOW(),NOW())
       RETURNING display_id`,
      [
        orderId,
        (cart as any).customer_id || null,
        cart.email,
        cart.subtotal,
        cart.shipping_total,
        cart.discount_total || 0,
        cart.total,
        (cart.promotions?.[0] as any)?.code || null,
        cart.shipping_address,
        cart.billing_address,
        paymentStatus === "paid" ? "processing" : "awaiting_payment",
        paymentStatus,
        (cart as any).metadata?.invoice_type === "kurumsal"
          ? "corporate"
          : "individual",
        {
          ...((cart as any).metadata || {}),
          payment_provider_id: providerId,
          payment_token:
            providerId === "pp_iyzico_iyzico"
              ? String(paymentSession?.data?.token || "")
              : undefined,
        },
        cart.tax_total || 0,
      ]
    )
    await client.query(
      `INSERT INTO store_order_status_history
       (id, order_id, status, note, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        createId("ordhist"),
        orderId,
        paymentStatus === "paid" ? "processing" : "awaiting_payment",
        paymentStatus === "paid"
          ? "Sipariş oluşturuldu; kart ödemesi doğrulandı."
          : "Sipariş oluşturuldu; ödeme bekleniyor.",
      ]
    )
    await client.query(
      `INSERT INTO store_payment
       (id, order_id, provider_id, status, amount, currency_code,provider_reference, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'try',$6, NOW(), NOW())`,
      [
        createId("pay"),
        orderId,
        providerId,
        paymentStatus,
        cart.total,
        providerReference,
      ]
    )
    await client.query(
      `INSERT INTO store_invoice
       (id,order_id,invoice_type,status,provider_id,metadata, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6, NOW(), NOW())
       ON CONFLICT (order_id) DO NOTHING`,
      [
        createId("inv"),
        orderId,
        (cart as any).metadata?.invoice_type === "kurumsal"
          ? "corporate"
          : "individual",
        paymentStatus === "paid" ? "pending" : "awaiting_payment",
        settings.invoice_settings.provider || settings.invoice_provider || "manual",
        {
          auto_invoice: Boolean(settings.invoice_settings.autoInvoice),
          payment_status: paymentStatus,
          tax_total: cart.tax_total || 0,
          vat_rate: settings.tax_settings.vatRate,
          prices_include_vat: settings.tax_settings.includeVat,
        },
      ]
    )
    await client.query(
      `INSERT INTO notification_outbox
       (id, type, recipient, subject, payload, created_at, updated_at)
       VALUES ($1, 'order_created', $2, $3, $4, NOW(), NOW())`,
      [
        orderNotificationId,
        cart.email,
        "Siparişiniz alındı",
        {
          order_id: createdOrder.rows[0]?.display_id
            ? `#${createdOrder.rows[0].display_id}`
            : orderId,
          total: cart.total,
          currency_code: "try",
          payment_status: paymentStatus,
        },
      ]
    )
    for (const item of cart.items || []) {
      await client.query(
        `INSERT INTO store_order_item
         (id,order_id,product_id,variant_id,title,thumbnail,sku,quantity,
          unit_price,total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          createId("orditem"),
          orderId,
          item.product_id,
          item.variant_id,
          item.title,
          item.thumbnail,
          item.variant?.sku || null,
          item.quantity,
          item.unit_price,
          item.total,
        ]
      )
    }
    await client.query(
      `UPDATE store_cart SET completed_at=NOW(),updated_at=NOW() WHERE id=$1`,
      [id]
    )
    await client.query(
      `UPDATE store_inventory_reservation
       SET status='completed',updated_at=NOW()
       WHERE cart_id=$1 AND status='active'`,
      [id]
    )
    if (appliedCouponCode) {
      const couponResult = await client.query(
        `UPDATE store_coupon
         SET usage_count=usage_count+1,updated_at=NOW()
         WHERE UPPER(code)=UPPER($1)
           AND is_active=TRUE
           AND (starts_at IS NULL OR starts_at <= NOW())
           AND (ends_at IS NULL OR ends_at >= NOW())
           AND (usage_limit IS NULL OR usage_count < usage_limit)
         RETURNING id`,
        [appliedCouponCode]
      )
      if (!couponResult.rowCount) {
        throw new Error("İndirim kodunun kullanım süresi veya limiti sona erdi.")
      }
    }
  })

  // Sipariş tamamlanma sayfasına yönlenmeden önce ilk e-postayı gönder. Sağlayıcı
  // geçici olarak erişilemiyorsa outbox kaydı cron tarafından tekrar denenir.
  await processNotificationOutbox(1, [orderNotificationId]).catch(() => {})

  await setRecentOrderAccess(orderId)
  await removeCartId()
  await refreshCart()
  redirect(`/siparis/${orderId}/confirmed`)
}

export async function updateRegion(_countryCode: string, currentPath: string) {
  redirect(currentPath || "/")
}

async function shippingOptions(cartId?: string) {
  const settings = await getCommerceSettings()
  let subtotal = 0
  if (cartId) {
    const rows = await query<{ subtotal: string }>(
      `SELECT COALESCE(SUM(quantity * unit_price),0)::text AS subtotal
       FROM store_cart_item WHERE cart_id=$1`,
      [cartId]
    )
    subtotal = Number(rows[0]?.subtotal || 0)
  }
  return buildShippingOptions(subtotal, settings.shipping_methods)
}

export async function listCartOptions(cartId?: string) {
  return { shipping_options: (await shippingOptions(cartId)) as any[] }
}
