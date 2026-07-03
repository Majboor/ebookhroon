import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site"

export const runtime = "edge"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / authenticated surfaces should not be crawled.
        disallow: ["/dashboard", "/edit/", "/api/", "/login", "/register"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  }
}
