import { Suspense } from "react"
import { Search, BookX, AlertTriangle } from "lucide-react"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchBox } from "@/components/search/search-box"
import { SearchResults } from "@/components/search/search-results"
import { searchBooks } from "@/lib/actions/search"

export const runtime = "edge"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export const metadata = {
  title: "Search",
  description:
    "Search inside every published book on Folio — find a title, a chapter, or a phrase you half-remember.",
}

async function Results({ query }: { query: string }) {
  let data
  try {
    data = await searchBooks(query)
  } catch {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-paper py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
          <AlertTriangle className="h-6 w-6 text-ink-muted" />
        </div>
        <h3 className="mb-2 font-serif text-xl font-semibold text-ink">
          Search is unavailable
        </h3>
        <p className="max-w-md text-sm text-ink-muted">
          The catalog could not be reached right now. Check the backend URL and
          try again.
        </p>
      </div>
    )
  }

  if (data.results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
          <BookX className="h-6 w-6 text-ink-muted" />
        </div>
        <h3 className="mb-2 font-serif text-xl font-semibold text-ink">
          Nothing found for “{query}”
        </h3>
        <p className="max-w-md text-sm text-ink-muted">
          Try a different word or phrase — search looks through book titles,
          authors, chapters and the words on every page.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-5 text-sm text-ink-muted">
        <span className="font-medium text-ink">{data.resultCount}</span>{" "}
        {data.resultCount === 1 ? "book" : "books"} match{" "}
        <span className="font-medium text-ink">“{query}”</span>
      </p>
      <SearchResults results={data.results} query={query} />
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-5 rounded-2xl border border-border bg-paper p-5">
          <Skeleton className="aspect-[3/4] w-32 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-3 py-1">
            <Skeleton className="h-5 w-1/2 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
            <Skeleton className="h-16 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = (q ?? "").trim()
  const hasQuery = query.length >= 2

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-forest/8 px-3 py-1 text-xs font-medium text-forest">
            <Search className="h-3.5 w-3.5" />
            Search inside every book
          </div>
          <h1 className="font-serif text-4xl font-bold text-forest">
            Find any word, on any page
          </h1>
          <p className="mt-2 max-w-xl text-ink-light">
            This isn&apos;t just a title search. Folio reads through the full text
            of every published book — chapters, paragraphs, pull-quotes and
            captions — and takes you straight to the page.
          </p>
        </div>

        <SearchBox initialQuery={query} autoFocus={!hasQuery} className="mb-10" />

        {hasQuery ? (
          <Suspense key={query} fallback={<ResultsSkeleton />}>
            <Results query={query} />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
              <Search className="h-6 w-6 text-ink-muted" />
            </div>
            <h3 className="mb-2 font-serif text-xl font-semibold text-ink">
              Start typing to search
            </h3>
            <p className="max-w-sm text-sm text-ink-muted">
              Try an author&apos;s name, a chapter title, or a phrase you remember
              reading.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
