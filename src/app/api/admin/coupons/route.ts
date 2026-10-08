import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import {
  getStoreCoupons,
  createStoreCoupon,
  updateStoreCoupon,
  deleteStoreCoupon,
} from "@lib/commerce/repository"

export async function GET() {
  if (!(await getAdminSession(["Admin", "Yönetici"]))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  }
  try {
    const coupons = await getStoreCoupons()
    return NextResponse.json({ coupons })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Kuponlar getirilirken hata oluştu." },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  if (!(await getAdminSession(["Admin", "Yönetici"]))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  }
  try {
    const body = await req.json()
    if (!body.code) {
      return NextResponse.json({ error: "Kupon kodu zorunludur." }, { status: 400 })
    }
    const coupon = await createStoreCoupon({
      code: body.code,
      type: body.type || "percentage",
      value: Number(body.value) || 0,
      min_subtotal: Number(body.min_subtotal) || 0,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      usage_limit: body.usage_limit ? Number(body.usage_limit) : null,
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
      description: body.description || null,
      free_shipping: body.free_shipping === true,
    })
    return NextResponse.json({ coupon })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Kupon oluşturulurken hata oluştu." },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  if (!(await getAdminSession(["Admin", "Yönetici"]))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  }
  try {
    const body = await req.json()
    if (!body.id) {
      return NextResponse.json({ error: "Kupon ID zorunludur." }, { status: 400 })
    }
    const coupon = await updateStoreCoupon(body.id, {
      code: body.code,
      type: body.type,
      value: body.value !== undefined ? Number(body.value) : undefined,
      min_subtotal: body.min_subtotal !== undefined ? Number(body.min_subtotal) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      usage_limit: body.usage_limit !== undefined ? (body.usage_limit ? Number(body.usage_limit) : null) : undefined,
      starts_at: body.starts_at !== undefined ? body.starts_at : undefined,
      ends_at: body.ends_at !== undefined ? body.ends_at : undefined,
      description: body.description !== undefined ? body.description : undefined,
      free_shipping: typeof body.free_shipping === "boolean" ? body.free_shipping : undefined,
    })
    return NextResponse.json({ coupon })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Kupon güncellenirken hata oluştu." },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  if (!(await getAdminSession(["Admin", "Yönetici"]))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Kupon ID zorunludur." }, { status: 400 })
    }
    await deleteStoreCoupon(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Kupon silinirken hata oluştu." },
      { status: 500 }
    )
  }
}
