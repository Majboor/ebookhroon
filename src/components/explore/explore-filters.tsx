"use client"

import { useRouter, usePathname } from "next/navigation"
import { Search, X } from "lucide-react"
import { useCallback, useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/utils"

interface ExploreFiltersProps {
  currentSearch?: string
  currentCategory?: string
  currentSort?: string
  categories: readonly string[]
}

export function ExploreFilters({
  currentSearch,
  currentCategory,
  currentSort,
  categories,
}: ExploreFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchVal, setSearchVal] = useState(currentSearch ?? "")

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      if (currentSearch) params.set("q", currentSearch)
      if (currentCategory) params.set("category", currentCategory)
      if (currentSort) params.set("sort", currentSort)

      for (const [key, val] of Object.entries(updates)) {
        if (val) params.set(key, val)
        else params.delete(key)
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, currentSearch, currentCategory, currentSort]
  )

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ q: searchVal || undefined })
  }

  function handleCategoryChange(cat: string) {
    updateParams({ category: cat === currentCategory ? undefined : cat })
  }

  function handleSortChange(s: string) {
    updateParams({ sort: s === currentSort ? undefined : s })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by title, author, or description…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
          {searchVal && (
            <button
              type="button"
              onClick={() => { setSearchVal(""); updateParams({ q: undefined }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-10 px-4 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-600 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange("")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            !currentCategory
              ? "bg-forest text-cream"
              : "bg-cream-200 text-ink-light hover:bg-cream-300 border border-border"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              currentCategory === cat
                ? "bg-forest text-cream"
                : "bg-cream-200 text-ink-light hover:bg-cream-300 border border-border"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-muted text-xs">Sort by:</span>
        {[
          { value: "newest", label: "Newest" },
          { value: "popular", label: "Most Viewed" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSortChange(opt.value)}
            className={cn(
              "px-3 py-1 rounded-md text-xs transition-colors",
              (currentSort === opt.value || (!currentSort && opt.value === "newest"))
                ? "bg-forest/10 text-forest font-medium"
                : "text-ink-muted hover:text-ink hover:bg-cream-200"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isPending && (
        <p className="text-xs text-ink-muted animate-pulse">Updating results…</p>
      )}
    </div>
  )
}
