// ─── Block Data Types (Discriminated Union) ───────────────────────────────────

export type TextBlockData = {
  type: "TEXT"
  content: string // HTML from TipTap
}

export type HeadingBlockData = {
  type: "HEADING"
  content: string
  level: 1 | 2 | 3
}

export type ImageBlockData = {
  type: "IMAGE"
  url: string
  alt: string
  caption?: string
}

export type YouTubeBlockData = {
  type: "YOUTUBE"
  videoId: string
  url: string
  title?: string
}

export type QuoteBlockData = {
  type: "QUOTE"
  content: string
  attribution?: string
}

export type DividerBlockData = {
  type: "DIVIDER"
  style?: "solid" | "dashed" | "dots" | "ornament"
}

export type BlockData =
  | TextBlockData
  | HeadingBlockData
  | ImageBlockData
  | YouTubeBlockData
  | QuoteBlockData
  | DividerBlockData

export type BlockType = "TEXT" | "IMAGE" | "YOUTUBE" | "QUOTE" | "DIVIDER" | "HEADING"

// ─── Core Models ─────────────────────────────────────────────────────────────

export type Block = {
  id: string
  pageId: string
  type: BlockType
  order: number
  data: BlockData
  createdAt: string
  updatedAt: string
}

export type Page = {
  id: string
  bookId: string
  pageNumber: number
  title?: string
  createdAt: string
  updatedAt: string
}

export type Book = {
  id: string
  ownerId?: string
  title: string
  subtitle?: string
  description?: string
  slug: string
  coverImage?: string
  authorName: string
  status: "draft" | "published"
  viewCount: number
  tags: string[]
  category?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export type UserRole = "admin" | "user"

export type User = {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

// ─── Enriched Types ───────────────────────────────────────────────────────────

export type PageWithBlocks = Page & {
  blocks: Block[]
}

export type BookWithPages = Book & {
  pages: PageWithBlocks[]
}

// ─── Action Result ────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
