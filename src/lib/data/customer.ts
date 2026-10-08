"use server"

import { HttpTypes } from "@medusajs/types"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId } from "@lib/commerce/repository"
import {
  clearCustomerSession,
  getCustomerSessionId,
  hashPassword,
  setCustomerSession,
  verifyPassword,
} from "@lib/commerce/customer-auth"
import { getCacheTag, getCartId, setCartId } from "./cookies"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { createHash, randomBytes } from "crypto"
import { getCanonicalURL } from "@lib/util/env"
import { checkRateLimit } from "@lib/security/rate-limit"
import { processNotificationOutbox } from "@lib/notifications/outbox"
import { getEmailBrandSettings } from "@lib/email/brand-settings"
import { findLoginAccount } from "@lib/commerce/login-identity"
import { checkPassword, verifyAdminTotp } from "@lib/admin/auth"

export type CustomerAuthState =
  | { state: "error"; error: string; field?: string }
  | { state: "verification_required"; email: string }
  | { state: "success" }
  | null

async function refresh() {
  revalidateTag("customers")
}

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    await ensureCommerceSchema()
    const id = await getCustomerSessionId()
    if (!id) return null
    const rows = await query<any>(
      `SELECT c.*,
        COALESCE((
          SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at)
          FROM store_customer_address a WHERE a.customer_id=c.id
        ),'[]'::jsonb) AS addresses,
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id',o.id,'display_id',o.display_id,'status',o.status,
            'email',o.email,'currency_code',o.currency_code,'total',o.total,
            'created_at',o.created_at
          ) ORDER BY o.created_at DESC)
          FROM store_order o WHERE o.customer_id=c.id
        ),'[]'::jsonb) AS orders
       FROM store_customer c WHERE c.id=$1 LIMIT 1`,
      [id]
    )
    const customer = rows[0] || null
    if (customer && Array.isArray(customer.addresses)) {
      customer.addresses = customer.addresses.map((a: any) => {
        const metadata = a.metadata || {}
        if (!metadata.email && customer.email) {
          metadata.email = customer.email
        }
        return { ...a, metadata }
      })
    }
    return customer as HttpTypes.StoreCustomer | null
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const id = await getCustomerSessionId()
  if (!id) throw new Error("Oturum bulunamadı.")
  const rows = await query<any>(
    `UPDATE store_customer SET
       first_name=COALESCE($2,first_name),last_name=COALESCE($3,last_name),
       phone=COALESCE($4,phone),company_name=COALESCE($5,company_name),
       updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [
      id,
      body.first_name || null,
      body.last_name || null,
      body.phone || null,
      body.company_name || null,
    ]
  )
  await refresh()
  return rows[0]
}

export async function changeCustomerPassword(
  _currentState: { success: boolean; error: string | null },
  formData: FormData
) {
  const customerId = await getCustomerSessionId()
  if (!customerId) return { success: false, error: "Oturum bulunamadı." }

  const newPassword = String(formData.get("new_password") || "").trim()
  const confirmation = String(formData.get("confirm_password") || "").trim()

  if (newPassword.length < 10) {
    return { success: false, error: "Yeni şifre en az 10 karakter olmalıdır." }
  }
  if (newPassword !== confirmation) {
    return { success: false, error: "Yeni şifreler eşleşmiyor." }
  }

  const updated = await query<{ email: string }>(
    "UPDATE store_customer SET password_hash=$2,updated_at=NOW() WHERE id=$1 RETURNING email",
    [customerId, hashPassword(newPassword)],
  )
  if (updated[0]?.email) {
    const notificationId = createId("notif")
    await query(
      `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
       VALUES ($1,'password_changed',$2,'Mağaza şifre değişikliği bildirimi',$3)`,
      [notificationId, updated[0].email, {}],
    )
    await processNotificationOutbox(1, [notificationId]).catch((error) =>
      console.error("Şifre değişikliği bildirimi gönderilemedi:", error),
    )
  }
  await refresh()
  return { success: true, error: null }
}

const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex")

async function queueEmailVerification(customerId: string, email: string) {
  const token = randomBytes(32).toString("hex")
  const notificationId = createId("notif")
  await query(
    `DELETE FROM store_customer_token
     WHERE customer_id=$1 AND type='email_verification' AND used_at IS NULL`,
    [customerId]
  )
  await query(
    `INSERT INTO store_customer_token
     (id,customer_id,type,token_hash,expires_at)
     VALUES ($1,$2,'email_verification',$3,NOW()+INTERVAL '24 hours')`,
    [createId("custtoken"), customerId, tokenHash(token)]
  )
  await query(
    `INSERT INTO notification_outbox
     (id,type,recipient,subject,payload)
     VALUES ($1,'email_verification',$2,'Mağaza e-posta doğrulama',$3)`,
    [
      notificationId,
      email,
      { verification_url: getCanonicalURL(`/verify-account?token=${token}`) },
    ]
  )
  // Vercel cron bir geri dönüş mekanizmasıdır; doğrulama e-postasını şimdi gönder.
  await processNotificationOutbox(1, [notificationId]).catch((error) =>
    console.error("E-posta doğrulama bildirimi gönderilemedi:", error),
  )
}

export async function requestPasswordReset(
  _state: { success: boolean; error: string | null },
  formData: FormData
) {
  await ensureCommerceSchema()
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 254)
  const rate = await checkRateLimit(
    `password-reset:${tokenHash(email).slice(0, 32)}`,
    5,
    60 * 60
  )
  if (!rate.allowed) {
    return {
      success: false,
      error: "Çok fazla şifre sıfırlama talebi gönderildi. Lütfen daha sonra tekrar deneyin.",
    }
  }
  const customers = await query<{ id: string }>(
    "SELECT id FROM store_customer WHERE email=$1 LIMIT 1",
    [email]
  )
  if (customers[0]) {
    const token = randomBytes(32).toString("hex")
    const notificationId = createId("notif")
    await query(
      `INSERT INTO store_customer_token
       (id,customer_id,type,token_hash,expires_at)
       VALUES ($1,$2,'password_reset',$3,NOW()+INTERVAL '30 minutes')`,
      [createId("custtoken"), customers[0].id, tokenHash(token)]
    )
    await query(
      `INSERT INTO notification_outbox
       (id,type,recipient,subject,payload)
       VALUES ($1,'password_reset',$2,'Mağaza şifre sıfırlama',$3)`,
      [
        notificationId,
        email,
        { reset_url: getCanonicalURL(`/sifremi-yenile?token=${token}`) },
      ]
    )
    // Şifre sıfırlama bağlantısı kısa süreli olduğundan cron beklenmez.
    await processNotificationOutbox(1, [notificationId]).catch((error) =>
      console.error("Şifre sıfırlama bildirimi gönderilemedi:", error),
    )
  }
  return { success: true, error: null }
}

export async function resetCustomerPassword(
  _state: { success: boolean; error: string | null },
  formData: FormData
) {
  await ensureCommerceSchema()
  const token = String(formData.get("token") || "")
  const password = String(formData.get("password") || "")
  const confirmation = String(formData.get("confirmation") || "")
  if (password.length < 10 || password.length > 256) {
    return { success: false, error: "Şifre 10-256 karakter arasında olmalıdır." }
  }
  if (password !== confirmation) {
    return { success: false, error: "Şifreler eşleşmiyor." }
  }
  const rows = await query<{ id: string; customer_id: string; email: string }>(
    `SELECT token.id,token.customer_id,customer.email
     FROM store_customer_token token
     JOIN store_customer customer ON customer.id=token.customer_id
     WHERE token.token_hash=$1 AND token.type='password_reset' AND token.used_at IS NULL
       AND expires_at>NOW() LIMIT 1`,
    [tokenHash(token)]
  )
  if (!rows[0]) return { success: false, error: "Bağlantı geçersiz veya süresi dolmuş." }
  const notificationId = createId("notif")
  await withTransaction(async (client) => {
    await client.query(
      "UPDATE store_customer SET password_hash=$2,updated_at=NOW() WHERE id=$1",
      [rows[0].customer_id, hashPassword(password)]
    )
    await client.query(
      "UPDATE store_customer_token SET used_at=NOW() WHERE id=$1",
      [rows[0].id]
    )
    await client.query(
      `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
       VALUES ($1,'password_changed',$2,'Mağaza şifre değişikliği bildirimi',$3)`,
      [notificationId, rows[0].email, {}],
    )
  })
  await processNotificationOutbox(1, [notificationId]).catch((error) =>
    console.error("Şifre değişikliği bildirimi gönderilemedi:", error),
  )
  return { success: true, error: null }
}

export async function signup(
  _currentState: unknown,
  formData: FormData
): Promise<CustomerAuthState> {
  await ensureCommerceSchema()
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 254)
  const signupRate = await checkRateLimit(
    `customer-signup:${tokenHash(email).slice(0, 32)}`,
    5,
    60 * 60
  )
  if (!signupRate.allowed) {
    return {
      state: "error",
      error: "Çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin.",
    }
  }
  const password = String(formData.get("password") || "")
  const passwordConfirm = String(formData.get("password_confirm") || formData.get("confirm_password") || "")
  if (passwordConfirm && password !== passwordConfirm) {
    return {
      state: "error",
      error: "Şifreler birbiriyle eşleşmiyor.",
      field: "password_confirm",
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { state: "error", error: "Geçerli bir e-posta adresi girin.", field: "email" }
  if (password.length < 10 || password.length > 256)
    return {
      state: "error",
      error: "Şifre en az 10, en fazla 256 karakter olmalı.",
      field: "password",
    }
  const existing = await query<any>(
    `SELECT id,password_hash FROM store_customer WHERE email=$1 LIMIT 1`,
    [email]
  )
  let id = existing[0]?.id
  if (existing[0]?.password_hash)
    return { state: "error", error: "Bu e-posta zaten kayıtlı.", field: "email" }

  const firstName = String(formData.get("first_name") || "").trim()
  const lastName = String(formData.get("last_name") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const company = String(formData.get("company") || "").trim()

  if (!firstName || !lastName) {
    return {
      state: "error",
      error: "Lütfen ad ve soyad alanlarını doldurun.",
      field: !firstName ? "first_name" : "last_name",
    }
  }
  if (!phone) {
    return {
      state: "error",
      error: "Lütfen telefon numaranızı girin.",
      field: "phone",
    }
  }

  if (id) {
    await query(
      `UPDATE store_customer SET password_hash=$2,first_name=$3,last_name=$4,
       phone=$5,company_name=$6,email_verified=FALSE,updated_at=NOW() WHERE id=$1`,
      [
        id,
        hashPassword(password),
        firstName || null,
        lastName || null,
        phone || null,
        company || null,
      ]
    )
  } else {
    id = createId("cus")
    await query(
      `INSERT INTO store_customer
       (id,email,password_hash,first_name,last_name,phone,company_name,email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE)`,
      [
        id,
        email,
        hashPassword(password),
        firstName || null,
        lastName || null,
        phone || null,
        company || null,
      ]
    )
  }

  // Create default address if provided
  const address1 = String(formData.get("address_1") || "").trim()
  const city = String(formData.get("city") || "").trim()
  if (address1 && city) {
    const metadata = {
      address_type: String(formData.get("address_type") || "bireysel"),
      email: email,
      tax_office: String(formData.get("tax_office") || "").trim(),
      tax_number: String(formData.get("tax_number") || "").trim(),
      district: String(formData.get("district") || "").trim(),
      neighborhood: String(formData.get("neighborhood") || "").trim(),
      address_title: String(formData.get("address_title") || "Adres"),
    }
    await query(
      `INSERT INTO store_customer_address
       (id,customer_id,address_name,is_default_shipping,is_default_billing,
        company,first_name,last_name,address_1,address_2,city,country_code,
        province,postal_code,phone,metadata)
       VALUES ($1,$2,$3,TRUE,TRUE,$4,$5,$6,$7,$8,$9,'tr',$10,$11,$12,$13::jsonb)`,
      [
        createId("addr"),
        id,
        formData.get("address_title") || "Adres",
        company || null,
        firstName || null,
        lastName || null,
        address1,
        formData.get("address_2") || null,
        city,
        formData.get("district") || formData.get("province") || null,
        formData.get("postal_code") || "34000",
        phone || null,
        JSON.stringify(metadata),
      ]
    )
  }

  await queueEmailVerification(id, email)
  const brand = await getEmailBrandSettings()
  const adminNotificationIds: string[] = []
  for (const [index, adminEmail] of brand.adminEmails.entries()) {
    if (adminEmail === email) continue
    const notificationId = `notif_customer_registered_${id}_${index}`
    await query(
      `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
       VALUES ($1,'customer_registered_admin',$2,$3,$4)
       ON CONFLICT (id) DO NOTHING`,
      [notificationId, adminEmail, "Yeni müşteri kaydı", {
        customer_id: id,
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
      }]
    )
    adminNotificationIds.push(notificationId)
  }
  if (adminNotificationIds.length) {
    await processNotificationOutbox(adminNotificationIds.length, adminNotificationIds).catch(() => {})
  }
  await refresh()
  return { state: "verification_required", email }
}

export async function login(
  _currentState: unknown,
  formData: FormData
): Promise<CustomerAuthState> {
  await ensureCommerceSchema()
  const identifier = String(formData.get("identifier") || formData.get("email") || "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") || "")
  const loginRate = await checkRateLimit(
    `customer-login:${tokenHash(identifier).slice(0, 32)}`,
    10,
    15 * 60,
    { failClosed: true }
  )
  if (!loginRate.allowed) {
    return {
      state: "error",
      error: "Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.",
    }
  }
  if (!identifier || identifier.length > 254 || password.length === 0 || password.length > 256) {
    return { state: "error", error: "Kullanıcı adı, e-posta veya şifre hatalı." }
  }
  const account = await findLoginAccount(identifier)
  const passwordValid = account?.id === "cust_admin_master"
    ? checkPassword(password) && verifyAdminTotp(String(formData.get("otp") || ""))
    : Boolean(account && verifyPassword(password, account.password_hash))
  if (!account || !passwordValid)
    return { state: "error", error: "Kullanıcı adı, e-posta veya şifre hatalı." }
  if (!account.email_verified) {
    await queueEmailVerification(account.id, account.email)
    return { state: "verification_required", email: account.email }
  }
  await setCustomerSession(account.id)
  await transferFavorites(
    account.id,
    String(formData.get("guest_favorites") || "")
  )
  await transferCart()
  await refresh()
  return { state: "success" }
}

export async function confirmEmailVerification(token: string) {
  await ensureCommerceSchema()
  const rows = await query<{
    id: string
    customer_id: string
    email: string
    first_name: string | null
  }>(
    `SELECT token.id,token.customer_id,customer.email,customer.first_name
     FROM store_customer_token token
     JOIN store_customer customer ON customer.id=token.customer_id
     WHERE token.token_hash=$1 AND token.type='email_verification'
       AND token.used_at IS NULL AND token.expires_at>NOW() LIMIT 1`,
    [tokenHash(token)]
  )
  if (!rows[0]) return { success: false }
  const notificationId = createId("notif")
  await withTransaction(async (client) => {
    await client.query(
      "UPDATE store_customer SET email_verified=TRUE,updated_at=NOW() WHERE id=$1",
      [rows[0].customer_id]
    )
    await client.query(
      "UPDATE store_customer_token SET used_at=NOW() WHERE id=$1",
      [rows[0].id]
    )
    await client.query(
      `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
       VALUES ($1,'account_welcome',$2,'Mağaza hesabınız hazır',$3)`,
      [notificationId, rows[0].email, { first_name: rows[0].first_name || "" }],
    )
  })
  await processNotificationOutbox(1, [notificationId]).catch((error) =>
    console.error("Hoş geldiniz bildirimi gönderilemedi:", error),
  )
  return { success: true }
}

export async function signout(_countryCode = "tr") {
  await clearCustomerSession()
  await refresh()
  redirect("/hesabim")
}

export async function transferCart() {
  const [cookieCartId, customerId] = await Promise.all([
    getCartId(),
    getCustomerSessionId(),
  ])
  if (!customerId) return

  const targetCartId = await withTransaction(async (client) => {
    const customer = await client.query<{ email: string }>(
      `SELECT email FROM store_customer WHERE id=$1 LIMIT 1`,
      [customerId]
    )

    let targetId: string | null = null
    if (cookieCartId) {
      const current = await client.query<{ id: string }>(
        `SELECT id FROM store_cart
         WHERE id=$1 AND completed_at IS NULL
         FOR UPDATE`,
        [cookieCartId]
      )
      targetId = current.rows[0]?.id || null
    }

    if (!targetId) {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM store_cart
         WHERE customer_id=$1 AND completed_at IS NULL
         ORDER BY updated_at DESC
         LIMIT 1
         FOR UPDATE`,
        [customerId]
      )
      targetId = existing.rows[0]?.id || null
    }

    if (!targetId) return null

    const otherCarts = await client.query<{ id: string }>(
      `SELECT id FROM store_cart
       WHERE customer_id=$1 AND completed_at IS NULL AND id<>$2
       ORDER BY updated_at`,
      [customerId, targetId]
    )

    for (const cart of otherCarts.rows) {
      await client.query(
        `INSERT INTO store_cart_item
           (id,cart_id,variant_id,quantity,unit_price,created_at,updated_at)
         SELECT id,$1,variant_id,quantity,unit_price,created_at,NOW()
         FROM store_cart_item
         WHERE cart_id=$2
         ON CONFLICT (cart_id,variant_id) DO UPDATE SET
           quantity=store_cart_item.quantity+EXCLUDED.quantity,
           unit_price=EXCLUDED.unit_price,
           updated_at=NOW()`,
        [targetId, cart.id]
      )
      await client.query(`DELETE FROM store_cart WHERE id=$1`, [cart.id])
    }

    await client.query(
      `UPDATE store_cart
       SET customer_id=$2,email=COALESCE(email,$3),updated_at=NOW()
       WHERE id=$1 AND completed_at IS NULL`,
      [targetId, customerId, customer.rows[0]?.email || null]
    )
    return targetId
  })

  if (!targetCartId) return
  await setCartId(targetCartId)
  const tag = await getCacheTag("carts")
  if (tag) revalidateTag(tag)
  revalidateTag("customers")
}

async function transferFavorites(customerId: string, rawFavorites: string) {
  if (!rawFavorites) return

  let favorites: Array<{ id?: unknown; variantId?: unknown }> = []
  try {
    const parsed = JSON.parse(rawFavorites)
    if (Array.isArray(parsed)) favorites = parsed.slice(0, 100)
  } catch {
    return
  }

  const normalized = favorites
    .map((favorite) => ({
      productId:
        typeof favorite?.id === "string" ? favorite.id.trim() : "",
      variantId:
        typeof favorite?.variantId === "string"
          ? favorite.variantId.trim()
          : null,
    }))
    .filter((favorite) => favorite.productId)

  if (!normalized.length) return

  await withTransaction(async (client) => {
    for (const favorite of normalized) {
      await client.query(
        `INSERT INTO store_customer_favorite
           (customer_id,product_id,variant_id)
         SELECT $1,p.id,
                CASE WHEN EXISTS (
                  SELECT 1 FROM store_variant v
                  WHERE v.id=$3 AND v.product_id=p.id
                ) THEN $3 ELSE (
                  SELECT v.id FROM store_variant v
                  WHERE v.product_id=p.id
                  ORDER BY v.created_at LIMIT 1
                ) END
         FROM store_product p
         WHERE p.id=$2 AND p.status='published'
         ON CONFLICT (customer_id,product_id) DO UPDATE SET
           variant_id=COALESCE(EXCLUDED.variant_id,store_customer_favorite.variant_id),
           updated_at=NOW()`,
        [customerId, favorite.productId, favorite.variantId]
      )
    }
  })
}

export const addCustomerAddress = async (
  _currentState: Record<string, unknown>,
  formData: FormData
) => {
  const customerId = await getCustomerSessionId()
  if (!customerId) return { success: false, error: "Oturum bulunamadı." }

  const addressType = String(formData.get("address_type") || "ev")
  const isDefaultShipping = formData.get("is_default_shipping") === "on" || formData.get("is_default_shipping") === "true"
  const isDefaultBilling = formData.get("is_default_billing") === "on" || formData.get("is_default_billing") === "true"

  const metadata = {
    address_type: addressType,
    email: String(formData.get("email") || "").trim(),
    tax_office: String(formData.get("tax_office") || "").trim(),
    tax_number: String(formData.get("tax_number") || "").trim(),
    district: String(formData.get("district") || "").trim(),
    neighborhood: String(formData.get("neighborhood") || "").trim(),
    delivery_note: String(formData.get("delivery_note") || "").trim(),
    address_title: String(formData.get("address_title") || "").trim(),
  }

  if (isDefaultShipping) {
    await query(
      `UPDATE store_customer_address SET is_default_shipping=FALSE WHERE customer_id=$1`,
      [customerId]
    )
  }
  if (isDefaultBilling) {
    await query(
      `UPDATE store_customer_address SET is_default_billing=FALSE WHERE customer_id=$1`,
      [customerId]
    )
  }

  await query(
    `INSERT INTO store_customer_address
     (id,customer_id,address_name,is_default_shipping,is_default_billing,
      company,first_name,last_name,address_1,address_2,city,country_code,
      province,postal_code,phone,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'tr',$12,$13,$14,$15::jsonb)`,
    [
      createId("addr"),
      customerId,
      formData.get("address_title") || formData.get("address_name") || "Adres",
      isDefaultShipping,
      isDefaultBilling,
      formData.get("company") || null,
      formData.get("first_name") || null,
      formData.get("last_name") || null,
      formData.get("address_1") || null,
      formData.get("address_2") || null,
      formData.get("city") || null,
      formData.get("district") || formData.get("province") || null,
      formData.get("postal_code") || null,
      formData.get("phone") || null,
      JSON.stringify(metadata),
    ]
  )
  await refresh()
  return { success: true, error: null }
}

export const deleteCustomerAddress = async (addressId: string) => {
  const customerId = await getCustomerSessionId()
  if (!customerId) return
  await query(
    `DELETE FROM store_customer_address WHERE id=$1 AND customer_id=$2`,
    [addressId, customerId]
  )
  await refresh()
}

export const updateCustomerAddress = async (
  _currentState: Record<string, unknown>,
  formData: FormData
) => {
  const customerId = await getCustomerSessionId()
  const addressId =
    String(_currentState.addressId || formData.get("addressId") || "")
  if (!customerId || !addressId)
    return { success: false, error: "Adres bulunamadı." }

  const addressType = String(formData.get("address_type") || "ev")
  const isDefaultShipping = formData.get("is_default_shipping") === "on" || formData.get("is_default_shipping") === "true"
  const isDefaultBilling = formData.get("is_default_billing") === "on" || formData.get("is_default_billing") === "true"

  const metadata = {
    address_type: addressType,
    email: String(formData.get("email") || "").trim(),
    tax_office: String(formData.get("tax_office") || "").trim(),
    tax_number: String(formData.get("tax_number") || "").trim(),
    district: String(formData.get("district") || "").trim(),
    neighborhood: String(formData.get("neighborhood") || "").trim(),
    delivery_note: String(formData.get("delivery_note") || "").trim(),
    address_title: String(formData.get("address_title") || "").trim(),
  }

  if (isDefaultShipping) {
    await query(
      `UPDATE store_customer_address SET is_default_shipping=FALSE WHERE customer_id=$1`,
      [customerId]
    )
  }
  if (isDefaultBilling) {
    await query(
      `UPDATE store_customer_address SET is_default_billing=FALSE WHERE customer_id=$1`,
      [customerId]
    )
  }

  await query(
    `UPDATE store_customer_address SET
       address_name=$3,is_default_shipping=$4,is_default_billing=$5,
       company=$6,first_name=$7,last_name=$8,address_1=$9,address_2=$10,
       city=$11,province=$12,postal_code=$13,phone=$14,metadata=$15::jsonb,updated_at=NOW()
     WHERE id=$1 AND customer_id=$2`,
    [
      addressId,
      customerId,
      formData.get("address_title") || formData.get("address_name") || "Adres",
      isDefaultShipping,
      isDefaultBilling,
      formData.get("company") || null,
      formData.get("first_name") || null,
      formData.get("last_name") || null,
      formData.get("address_1") || null,
      formData.get("address_2") || null,
      formData.get("city") || null,
      formData.get("district") || formData.get("province") || null,
      formData.get("postal_code") || null,
      formData.get("phone") || null,
      JSON.stringify(metadata),
    ]
  )
  await refresh()
  return { success: true, error: null }
}

export async function updateCustomerProfile(
  _prevState: { success: boolean; error: string | null },
  formData: FormData
) {
  try {
    const id = await getCustomerSessionId()
    if (!id) return { success: false, error: "Oturum bulunamadı." }

    const firstName = String(formData.get("first_name") || "").trim()
    const lastName = String(formData.get("last_name") || "").trim()
    const email = String(formData.get("email") || "").trim().toLowerCase()
    const phone = String(formData.get("phone") || "").trim()

    if (!firstName || !lastName) {
      return { success: false, error: "Lütfen ad ve soyad alanlarını doldurun." }
    }
    if (!email) {
      return { success: false, error: "Lütfen e-posta adresinizi girin." }
    }
    if (!phone) {
      return { success: false, error: "Lütfen telefon numaranızı girin." }
    }

    await query(
      `UPDATE store_customer SET first_name=$2, last_name=$3, email=$4, phone=$5, updated_at=NOW() WHERE id=$1`,
      [id, firstName, lastName, email, phone]
    )

    revalidateTag("customers")
    return { success: true, error: null }
  } catch (e: any) {
    return { success: false, error: e.message || "Profil güncellenirken bir hata oluştu." }
  }
}
