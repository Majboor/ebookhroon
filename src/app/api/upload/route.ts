import { NextRequest, NextResponse } from "next/server"
import { buildBackendUrl } from "@/lib/backend-api"
import { resolvePublicAssetUrl } from "@/lib/utils"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const response = await fetch(buildBackendUrl("/upload"), {
      method: "POST",
      body: formData,
      cache: "no-store",
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
