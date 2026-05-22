import Link from "next/link"
import { BookOpen, FileText, Quote, Image as ImageIcon, Youtube, Hash, Bookmark, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, resolvePublicAssetUrl } from "@/lib/utils"
import type { SearchResult, SearchSnippet } from "@/types"

const BLOCK_LABELS: Record<string, string> = {
  PAGE_TITLE: "Chapter title",
  HEADING: "Heading",
  TEXT: "Text",
  QUOTE: "Quote",
  IMAGE: "Image caption",
  YOUTUBE: "Video",
  DIVIDER: "Divider",
}

function BlockIcon({ type }: { type: string }) {
  const className = "h-3.5 w-3.5"
  switch (type) {
    case "PAGE_TITLE":
      return <Bookmark className={className} />
    case "HEADING":
      return <Hash className={className} />
    case "QUOTE":
      return <Quote className={className} />
    case "IMAGE":
      return <ImageIcon className={className} />
    case "YOUTUBE":
      return <Youtube className={className} />
    default:
      return <FileText className={className} />
  }
}

/** Split text on case-insensitive occurrences of `query` and wrap matches. */
function highlight(text: string, query: string) {
  const q = query.trim()
  if (!q) return text

  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const out: React.ReactNode[] = []
  let cursor = 0
  let idx = lower.indexOf(needle, cursor)
  let key = 0

  while (idx !== -1) {
    if (idx > cursor) out.push(text.slice(cursor, idx))
    out.push(
      <mark
        key={key++}
        className="rounded-[3px] bg-gold-200/70 px-0.5 font-medium text-ink"
      >
        {text.slice(idx, idx + needle.length)}
      </mark>
    )
    cursor = idx + needle.length
    idx = lower.indexOf(needle, cursor)
  }
  if (cursor < text.length) out.push(text.slice(cursor))
  return out
}

function readHref(slug: string, page?: number | null) {
  return page ? `/read/${slug}?page=${page}` : `/read/${slug}`
}

function SnippetRow({
  slug,
  snippet,
  query,
}: {
  slug: string
  snippet: SearchSnippet
  query: string
}) {
  return (
    <Link
      href={readHref(slug, snippet.pageNumber)}
      className="group/snippet block rounded-lg border border-transparent px-3 py-2 -mx-1 transition-colors hover:border-border hover:bg-cream-100"
    >
      <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        <BlockIcon type={snippet.blockType} />
        <span>{BLOCK_LABELS[snippet.blockType] ?? "Text"}</span>
        <span aria-hidden>·</span>
        <span className="normal-case tracking-normal text-ink-muted">
          {snippet.pageTitle ? snippet.pageTitle : `Page ${snippet.pageNumber}`}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-ink-light">
        {highlight(snippet.text, query)}
      </p>
    </Link>
  )
}

function ResultCard({ result, query }: { result: SearchResult; query: string }) {
  const { book } = result
  const cover = resolvePublicAssetUrl(book.coverImage) ?? book.coverImage

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-paper shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        {/* Cover */}
        <Link
          href={readHref(book.slug, result.firstMatchPage)}
          className="group relative block w-full shrink-0 overflow-hidden rounded-xl shadow-book-sm sm:w-32"
        >
          <div className="aspect-[3/4] w-full">
            {cover ? (
              <img
                src={cover}
                alt={book.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-forest-700 to-forest-500 p-4">
                <BookOpen className="mb-2 h-8 w-8 text-white/40" />
                <p className="text-center font-serif text-xs font-semibold leading-snug text-white">
                  {book.title}
                </p>
              </div>
            )}
          </div>
        </Link>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={readHref(book.slug, result.firstMatchPage)}
                className="font-serif text-lg font-semibold leading-snug text-ink transition-colors hover:text-forest"
              >
                {highlight(book.title, query)}
              </Link>
              <p className="mt-0.5 text-sm text-ink-light">by {book.authorName}</p>
            </div>
            {book.category && (
              <Badge variant="cream" className="shrink-0 text-[10px]">
                {book.category}
              </Badge>
            )}
          </div>

          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            {result.titleMatch && "Title match"}
            {result.titleMatch && result.contentMatches > 0 && " · "}
            {result.contentMatches > 0 &&
              `${result.contentMatches} ${result.contentMatches === 1 ? "match" : "matches"} inside`}
            {!result.titleMatch && result.contentMatches === 0 && "Metadata match"}
          </p>

          {result.snippets.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-border/60 pt-3">
              {result.snippets.map((snippet, i) => (
                <SnippetRow
                  key={`${snippet.pageNumber}-${i}`}
                  slug={book.slug}
                  snippet={snippet}
                  query={query}
                />
              ))}
            </div>
          )}

          <Link
            href={readHref(book.slug, result.firstMatchPage)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-700"
          >
            {result.firstMatchPage
              ? `Open at page ${result.firstMatchPage}`
              : "Open book"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function SearchResults({
  results,
  query,
}: {
  results: SearchResult[]
  query: string
}) {
  return (
    <div className={cn("space-y-4")}>
      {results.map((result) => (
        <ResultCard key={result.book.id} result={result} query={query} />
      ))}
    </div>
  )
}
