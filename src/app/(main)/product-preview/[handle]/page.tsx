import { notFound } from "next/navigation"
import { getAdminSession } from "@lib/admin/auth"
import ProductPage, { generateMetadata as metadata } from "../../urunler/[handle]/product-page"

export const dynamic = "force-dynamic"
type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ v_id?: string }> }

export async function generateMetadata(props: Props) {
  if (!await getAdminSession()) notFound()
  const result = await metadata({ ...props, preview: true })
  return { ...result, robots: { index: false, follow: false } }
}
export default async function Preview(props: Props) {
  if (!await getAdminSession()) notFound()
  return <ProductPage {...props} preview />
}
