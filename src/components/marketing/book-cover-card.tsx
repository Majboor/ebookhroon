import Link from "next/link"
import { Eye, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, resolvePublicAssetUrl } from "@/lib/utils"
import type { Book } from "@/types"

interface BookCoverCardProps {
  book: Book
  className?: string
}

const COVER_COLORS = [
  "from-forest-700 to-forest-500",
  "from-gold-700 to-gold-500",
  "from-slate-700 to-slate-500",
  "from-rose-800 to-rose-600",
  "from-teal-800 to-teal-600",
  "from-indigo-800 to-indigo-600",
]

function getCoverColor(id: string): string {
  const idx = id.charCodeAt(0) % COVER_COLORS.length
  return COVER_COLORS[idx]
}

export function BookCoverCard({ book, className }: BookCoverCardProps) {
  const color = getCoverColor(book.id)
  const coverImage = resolvePublicAssetUrl(book.coverImage) ?? book.coverImage

  return (
    <Link
      href={`/read/${book.slug}`}
      className={cn("group block", className)}
    >
      <article className="flex flex-col h-full">
        {/* Cover */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-book-sm group-hover:shadow-book transition-shadow duration-300">
          {coverImage ? (
            <img
              src={coverImage}
              alt={book.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={cn("w-full h-full bg-gradient-to-br flex flex-col items-center justify-center p-6", color)}>
              <BookOpen className="h-10 w-10 text-white/40 mb-4" />
              <p className="text-white font-serif text-center text-sm font-semibold leading-snug">
                {book.title}
              </p>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-paper/90 text-ink text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
              Open Book
            </span>
          </div>

          {/* Spine effect */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Metadata */}
        <div className="mt-3 px-0.5">
          <h3 className="font-serif font-semibold text-ink text-sm leading-snug group-hover:text-forest transition-colors line-clamp-2">
            {book.title}
          </h3>
          {book.subtitle && (
            <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{book.subtitle}</p>
          )}
          <p className="text-xs text-ink-light mt-1">by {book.authorName}</p>

          <div className="flex items-center justify-between mt-2">
            {book.category && (
              <Badge variant="cream" className="text-[10px] px-2 py-0.5">
                {book.category}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-[10px] text-ink-faint ml-auto">
              <Eye className="h-3 w-3" />
              {book.viewCount}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
