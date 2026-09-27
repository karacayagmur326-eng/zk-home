import { permanentRedirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function WholesaleRedirectPage() {
  permanentRedirect("/toptan-ve-kurumsal-satis")
}
