"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import type { BookWithPages } from "@/types"

/**
 * Client-side lazy loader for the book editor. The editor pulls in TipTap,
 * dnd-kit and framer-motion — a large bundle that only signed-in authors on
 * the /edit route ever need. Splitting it into its own chunk keeps the route's
 * initial JS smaller and lets us show an accessible loading state while it
 * streams in.
 */
const BookEditor = dynamic(
  () => import("./book-editor").then((m) => m.BookEditor),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-cream gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 text-forest animate-spin" aria-hidden="true" />
        <p className="text-sm text-ink-muted">Loading editor…</p>
        <span className="sr-only">Loading the book editor, please wait.</span>
      </div>
    ),
  }
)

export function BookEditorLoader({ initialBook }: { initialBook: BookWithPages }) {
  return <BookEditor initialBook={initialBook} />
}
