"use server"

import { backendFetch } from "@/lib/backend-api"
import { resolvePublicAssetUrl } from "@/lib/utils"
import type { SearchResponse } from "@/types"

const EMPTY = (query: string): SearchResponse => ({
  query,
  resultCount: 0,
  results: [],
})

/**
 * Full-text "search inside" across published books — matches book titles,
 * metadata AND the actual page/block content, returning ranked results with
 * highlighted snippet excerpts that deep-link to the matching page.
 */
export async function searchBooks(query: string): Promise<SearchResponse> {
  const q = query.trim()
  if (q.length < 2) return EMPTY(q)

  const data = await backendFetch<SearchResponse>(
    `/search?q=${encodeURIComponent(q)}`
  )

  return {
    ...data,
    results: data.results.map((result) => ({
      ...result,
      book: {
        ...result.book,
        coverImage:
          resolvePublicAssetUrl(result.book.coverImage) ?? result.book.coverImage,
      },
    })),
  }
}
