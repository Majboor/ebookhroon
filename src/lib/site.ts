// ─── Central site / SEO configuration ─────────────────────────────────────────
// Single source of truth for discoverability metadata (canonical URL, social
// cards, structured data). Override the public URL per-environment with
// NEXT_PUBLIC_APP_URL — everything else derives from here.

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (raw) return raw.replace(/\/+$/, "")
  return "https://ebookhroon.pages.dev"
}

export const siteConfig = {
  name: "Folio",
  title: "Folio — Premium Digital Flipbooks",
  description:
    "Create and share beautiful digital flipbooks. Add rich text, images, and videos to stunning page-flipping books you can share with a single link.",
  url: resolveSiteUrl(),
  ogImage: "/opengraph-image",
  twitterHandle: "@folio",
  keywords: [
    "flipbook",
    "ebook",
    "digital book",
    "online publishing",
    "page-flip book",
    "book creator",
    "reading",
    "self publishing",
  ],
} as const

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${siteConfig.url}${suffix}`
}
