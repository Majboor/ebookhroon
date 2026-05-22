"use client"

import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface SearchBoxProps {
  initialQuery?: string
  autoFocus?: boolean
  className?: string
}

export function SearchBox({ initialQuery = "", autoFocus, className }: SearchBoxProps) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (q.length < 2) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  function clear() {
    setValue("")
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)} role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search inside every book — titles, chapters, a phrase you remember…"
        aria-label="Search books"
        className="h-14 w-full rounded-full border border-border bg-paper pl-12 pr-28 text-base text-ink shadow-sm outline-none transition-shadow placeholder:text-ink-faint focus:border-forest/40 focus:shadow-md [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-24 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint hover:bg-cream-200 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-cream shadow-sm transition-colors hover:bg-forest-700 disabled:opacity-50"
        disabled={value.trim().length < 2}
      >
        Search
      </button>
    </form>
  )
}
