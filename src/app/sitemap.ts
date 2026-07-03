import type { MetadataRoute } from "next"
import { getPublishedBooks } from "@/lib/actions/books"
import { absoluteUrl } from "@/lib/site"

export const runtime = "edge"
// Revalidate the sitemap hourly so newly published books get indexed.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/explore"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/create"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/login"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/register"), changeFrequency: "yearly", priority: 0.3 },
  ]

  let bookEntries: MetadataRoute.Sitemap = []
  try {
    const books = await getPublishedBooks({ sort: "newest" })
    bookEntries = books.map((book) => ({
      url: absoluteUrl(`/read/${book.slug}`),
      lastModified: book.updatedAt ? new Date(book.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }))
  } catch {
    // Backend unavailable at build time — ship the static routes only.
    bookEntries = []
  }

  return [...staticEntries, ...bookEntries]
}
