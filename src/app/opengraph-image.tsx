import { ImageResponse } from "next/og"
import { siteConfig } from "@/lib/site"

export const runtime = "edge"

export const alt = siteConfig.title
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Default social card for the site — rendered at request time on the edge.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1B3A2B 0%, #2C5A42 100%)",
          padding: "80px",
          color: "#FFFDF9",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              background: "#C9A24B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 46,
              fontWeight: 700,
              color: "#1B3A2B",
            }}
          >
            F
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            Your stories, beautifully bound.
          </div>
          <div style={{ fontSize: 34, color: "#D9E4DC", maxWidth: 900 }}>
            Create and share premium digital flipbooks — rich text, images and video,
            in a real page-flipping book.
          </div>
        </div>

        <div style={{ fontSize: 28, color: "#C9A24B", fontWeight: 600 }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size }
  )
}
