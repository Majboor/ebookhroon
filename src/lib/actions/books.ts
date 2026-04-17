"use server"

import { backendFetch, BackendApiError } from "@/lib/backend-api"
import { backendFetchWithSession } from "@/lib/auth"
import { resolvePublicAssetUrl } from "@/lib/utils"
import type { Book, ActionResult, Block, BlockData, BookWithPages, PageWithBlocks } from "@/types"
import { z } from "zod"

const CreateBookSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  authorName: z.string().min(1, "Author name is required").max(80),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const UpdateBookSchema = CreateBookSchema.extend({
  status: z.enum(["draft", "published"]).optional(),
})

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed"
}

function normalizeBlockData(data: BlockData): BlockData {
  if (data.type !== "IMAGE") {
    return data
  }

  return {
    ...data,
    url: resolvePublicAssetUrl(data.url) ?? data.url,
  }
}

function normalizeBlock(block: Block): Block {
  return {
    ...block,
    data: normalizeBlockData(block.data),
  }
}

function normalizePage(page: PageWithBlocks): PageWithBlocks {
  return {
    ...page,
    blocks: page.blocks.map(normalizeBlock),
  }
}

function normalizeBook<T extends Book>(book: T): T {
  return {
    ...book,
    coverImage: resolvePublicAssetUrl(book.coverImage) ?? book.coverImage,
  }
}

function normalizeBookWithPages(book: BookWithPages): BookWithPages {
  return {
    ...normalizeBook(book),
    pages: book.pages.map(normalizePage),
  }
}

export async function createBook(
  formData: FormData
): Promise<ActionResult<{ bookId: string; slug: string }>> {
  const raw = {
    title: formData.get("title") as string,
    subtitle: (formData.get("subtitle") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    authorName: formData.get("authorName") as string,
    coverImage: (formData.get("coverImage") as string) || undefined,
    category: (formData.get("category") as string) || undefined,
    tags: formData.getAll("tags") as string[],
  }

  const parsed = CreateBookSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    const data = await backendFetchWithSession<{ bookId: string; slug: string }>("/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...parsed.data,
        tags: parsed.data.tags?.filter(Boolean) ?? [],
      }),
    })

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateBook(
  bookId: string,
  formData: FormData
): Promise<ActionResult<Book>> {
  const raw = {
    title: formData.get("title") as string,
    subtitle: (formData.get("subtitle") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    authorName: formData.get("authorName") as string,
    coverImage: (formData.get("coverImage") as string) || undefined,
    category: (formData.get("category") as string) || undefined,
    tags: formData.getAll("tags") as string[],
    status: (formData.get("status") as "draft" | "published") || undefined,
  }

  const parsed = UpdateBookSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    const data = await backendFetchWithSession<Book>(`/books/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...parsed.data,
        tags: parsed.data.tags?.filter(Boolean) ?? [],
      }),
    })

    return { success: true, data: normalizeBook(data) }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function publishBook(bookId: string): Promise<ActionResult<Book>> {
  try {
    const data = await backendFetchWithSession<Book>(`/books/${bookId}/publish`, {
      method: "POST",
    })

    return { success: true, data: normalizeBook(data) }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function unpublishBook(bookId: string): Promise<ActionResult<Book>> {
  try {
    const data = await backendFetchWithSession<Book>(`/books/${bookId}/unpublish`, {
      method: "POST",
    })

    return { success: true, data: normalizeBook(data) }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function deleteBook(bookId: string): Promise<ActionResult> {
  try {
    await backendFetchWithSession<{ deleted: boolean }>(`/books/${bookId}`, {
      method: "DELETE",
    })

    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getBookWithPages(
  bookId: string
): Promise<BookWithPages | null> {
  try {
    const book = await backendFetchWithSession<BookWithPages>(`/books/${bookId}`)
    return normalizeBookWithPages(book)
  } catch (error) {
    if (error instanceof BackendApiError && (error.status === 404 || error.status === 403 || error.status === 401)) {
      return null
    }
    throw error
  }
}

export async function getBookBySlug(
  slug: string
): Promise<BookWithPages | null> {
  try {
    const book = await backendFetch<BookWithPages>(
      `/books/by-slug/${encodeURIComponent(slug)}`
    )
    return normalizeBookWithPages(book)
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function incrementBookViews(bookId: string): Promise<void> {
  await backendFetch<{ viewCount: number }>(`/books/${bookId}/views`, {
    method: "POST",
  })
}

export async function getPublishedBooks(opts?: {
  search?: string
  category?: string
  sort?: "newest" | "popular"
  limit?: number
}) {
  const params = new URLSearchParams()

  if (opts?.search) params.set("search", opts.search)
  if (opts?.category) params.set("category", opts.category)
  if (opts?.sort) params.set("sort", opts.sort)
  if (typeof opts?.limit === "number") params.set("limit", String(opts.limit))

  const suffix = params.toString() ? `?${params.toString()}` : ""
  const books = await backendFetch<Book[]>(`/books/published${suffix}`)
  return books.map(normalizeBook)
}

export async function getMyBooks(): Promise<Book[]> {
  const books = await backendFetchWithSession<Book[]>("/books/mine")
  return books.map(normalizeBook)
}
