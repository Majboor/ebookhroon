import { Suspense } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { BookCoverCard } from "@/components/marketing/book-cover-card"
import { Skeleton } from "@/components/ui/skeleton"
import { getPublishedBooks } from "@/lib/actions/books"
import { CATEGORIES } from "@/lib/utils"
import { ExploreFilters } from "@/components/explore/explore-filters"

export const runtime = "edge"

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
  }>
}

export const metadata = {
  title: "Explore Books",
  description: "Browse the Folio public library — beautiful digital flipbooks from writers worldwide.",
}

async function BookGrid({
  search,
  category,
  sort,
}: {
  search?: string
  category?: string
  sort?: string
}) {
  let books = []

  try {
    books = await getPublishedBooks({
      search,
      category,
      sort: sort === "popular" ? "popular" : "newest",
    })
  } catch {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-cream-200 flex items-center justify-center mb-4">
          <SlidersHorizontal className="h-7 w-7 text-ink-muted" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-ink mb-2">
          Library temporarily unavailable
        </h3>
        <p className="text-ink-muted text-sm max-w-md">
          The public catalog could not be loaded right now. Check the backend URL
          env in Cloudflare and try again.
        </p>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-cream-200 flex items-center justify-center mb-4">
          <Search className="h-7 w-7 text-ink-muted" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-ink mb-2">No books found</h3>
        <p className="text-ink-muted text-sm">
          {search
            ? `No results for "${search}". Try a different search term.`
            : "Be the first to publish in this category."}
        </p>
      </div>
    )
  }

  return (
    <>
      {books.map((book) => (
        <BookCoverCard key={book.id} book={book} />
      ))}
    </>
  )
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams
  const { q, category, sort } = params

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-4xl font-bold text-forest mb-3">
            Explore the Library
          </h1>
          <p className="text-ink-light max-w-xl">
            Discover books published by writers around the world.
          </p>
        </div>

        {/* Filters */}
        <ExploreFilters
          currentSearch={q}
          currentCategory={category}
          currentSort={sort}
          categories={CATEGORIES}
        />

        {/* Results */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 lg:gap-6 min-h-[400px]">
          <Suspense
            fallback={Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[3/4] rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          >
            <BookGrid search={q} category={category} sort={sort} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  )
}
