import { NextResponse } from "next/server"
import { retrieveCart, listCartOptions } from "@lib/data/cart"
import { getCustomerSessionId } from "@lib/commerce/customer-auth"
import { query } from "@lib/admin/db"
import { cookies } from "next/headers"
import { getAdminSession } from "@lib/admin/auth"

export const dynamic = "force-dynamic"

async function headerCustomer() {
  const id = await getCustomerSessionId()
  if (!id) return null
  const rows = await query<{ id: string; first_name: string; last_name: string; role: string }>(
    "SELECT id, first_name, last_name, role FROM store_customer WHERE id=$1 AND COALESCE(status,'Aktif')='Aktif' LIMIT 1", [id],
  )
  return rows[0] || null
}

// Private state is never placed in a public page or CDN cache.
export async function GET() {
  const [cart, customer, admin] = await Promise.all([
    retrieveCart(), headerCustomer(), getAdminSession(),
  ])
  const shippingOptions = cart ? (await listCartOptions()).shipping_options : []
  const onboarding = (await cookies()).get("_zkhome_onboarding")?.value === "true"
  return NextResponse.json({
    cart, shippingOptions, onboarding, admin: Boolean(admin), maintenanceBypass: admin?.role === "Admin",
    customer: customer ? { id: customer.id, first_name: customer.first_name, last_name: customer.last_name, role: (customer as { role?: string }).role } : null,
  }, { headers: { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" } })
}
