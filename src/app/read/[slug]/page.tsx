import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getBookBySlug, incrementBookViews } from "@/lib/actions/books"
import { FlipbookReader } from "@/components/reader/flipbook-reader"

export const runtime = "edge"

interface ReadPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ReadPageProps): Promise<Metadata> {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) return { title: "Book Not Found" }

  return {
    title: book.title,
    description: book.description ?? `Read "${book.title}" by ${book.authorName} on Folio.`,
    openGraph: {
      title: book.title,
      description: book.description ?? undefined,
      images: book.coverImage ? [{ url: book.coverImage }] : [],
    },
  }
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { slug } = await params
  const book = await getBookBySlug(slug)

  if (!book) notFound()

  // Fire-and-forget view count (don't await)
  if (book.status === "published") {
    incrementBookViews(book.id)
  }

  return <FlipbookReader book={book} />
}
