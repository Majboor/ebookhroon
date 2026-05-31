import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getBookBySlug, incrementBookViews } from "@/lib/actions/books"
import { FlipbookReader } from "@/components/reader/flipbook-reader"
import { ReadAloud } from "@/components/reader/read-aloud"
import { siteConfig, absoluteUrl } from "@/lib/site"

export const runtime = "edge"

interface ReadPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: ReadPageProps): Promise<Metadata> {
  const { slug } = await params
  const book = await getBookBySlug(slug)
  if (!book) return { title: "Book Not Found" }

  const canonical = `/read/${book.slug}`
  const description =
    book.description ?? `Read "${book.title}" by ${book.authorName} on ${siteConfig.name}.`
  const images = book.coverImage
    ? [{ url: book.coverImage, alt: book.title }]
    : [{ url: siteConfig.ogImage, alt: book.title }]

  return {
    title: book.title,
    description,
    authors: [{ name: book.authorName }],
    keywords: book.tags?.length ? book.tags : undefined,
    alternates: { canonical },
    robots: book.status === "published" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: book.title,
      description,
      url: absoluteUrl(canonical),
      siteName: siteConfig.name,
      images,
      authors: [book.authorName],
      publishedTime: book.publishedAt ?? book.createdAt,
      modifiedTime: book.updatedAt,
      tags: book.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description,
      images: images.map((i) => i.url),
    },
  }
}

export default async function ReadPage({ params, searchParams }: ReadPageProps) {
  const { slug } = await params
  const { page } = await searchParams
  const book = await getBookBySlug(slug)

  if (!book) notFound()

  // Fire-and-forget view count (don't await)
  if (book.status === "published") {
    incrementBookViews(book.id)
  }

  const parsedPage = page ? Number.parseInt(page, 10) : NaN
  const initialPageNumber = Number.isFinite(parsedPage) ? parsedPage : undefined

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
    ...(book.description ? { description: book.description } : {}),
    url: absoluteUrl(`/read/${book.slug}`),
    ...(book.coverImage ? { image: book.coverImage } : {}),
    author: { "@type": "Person", name: book.authorName },
    publisher: { "@type": "Organization", name: siteConfig.name },
    inLanguage: "en",
    numberOfPages: book.pages?.length ?? undefined,
    datePublished: book.publishedAt ?? book.createdAt,
    dateModified: book.updatedAt,
    ...(book.tags?.length ? { keywords: book.tags.join(", ") } : {}),
    ...(book.category ? { genre: book.category } : {}),
  }

  return (
    <>
      {book.status === "published" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
        />
      )}
      <FlipbookReader book={book} initialPageNumber={initialPageNumber} />
      <ReadAloud book={book} />
    </>
  )
}
