import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import slugify from "slugify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function createSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  })
}

export function makeUniqueSlug(base: string, existingSlugs: string[]): string {
  const slug = createSlug(base)
  if (!existingSlugs.includes(slug)) return slug
  let counter = 1
  while (existingSlugs.includes(`${slug}-${counter}`)) {
    counter++
  }
  return `${slug}-${counter}`
}

/** Extract YouTube video ID from various URL formats */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + "…"
}

function getPublicAssetBaseUrl(): string | null {
  const baseUrl =
    process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ??
    process.env.FASTAPI_BASE_URL ??
    process.env.UPLOAD_PUBLIC_BASE_URL ??
    process.env.PUBLIC_UPLOAD_BASE_URL

  return baseUrl ? baseUrl.replace(/\/+$/, "") : null
}

export function resolvePublicAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined

  if (
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) ||
    url.startsWith("//") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url
  }

  const baseUrl = getPublicAssetBaseUrl()
  if (!baseUrl) return url

  try {
    return new URL(url, `${baseUrl}/`).toString()
  } catch {
    return url
  }
}

/** Sanitize HTML for safe rendering (server-side) */
export function sanitizeHtml(html: string): string {
  // Basic tag whitelist — for richer sanitization, use isomorphic-dompurify in the component
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
}

export const CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Science",
  "Technology",
  "Arts & Design",
  "History",
  "Philosophy",
  "Education",
  "Travel",
  "Cooking",
  "Health & Wellness",
  "Business",
  "Poetry",
  "Children",
  "Comics & Manga",
  "Other",
] as const

export type Category = (typeof CATEGORIES)[number]
