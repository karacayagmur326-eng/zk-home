import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"

export async function GET() {
  try {
    // Use the same authorization policy as every protected admin endpoint.
    const session = await getAdminSession()
    if (session) {
      return NextResponse.json({
        authenticated: true,
        email: session.email,
        role: session.role,
      })
    }

    return NextResponse.json({ authenticated: false })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}
