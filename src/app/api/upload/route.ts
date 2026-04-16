import { NextRequest, NextResponse } from "next/server"
import { SESSION_HEADER_NAME, SESSION_COOKIE_NAME } from "@/lib/auth-constants"
import { buildBackendUrl } from "@/lib/backend-api"
import { resolvePublicAssetUrl } from "@/lib/utils"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value
    const headers = new Headers()

    if (sessionToken) {
      headers.set(SESSION_HEADER_NAME, sessionToken)
    }

    const response = await fetch(buildBackendUrl("/upload"), {
      method: "POST",
      body: formData,
      cache: "no-store",
      headers,
    })

    const payload = await response.json()
    if (typeof payload?.url === "string") {
      payload.url = resolvePublicAssetUrl(payload.url) ?? payload.url
    }
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error("Upload proxy error:", error)
    return NextResponse.json(
      { error: "Upload backend is unavailable" },
      { status: 502 }
    )
  }
}
