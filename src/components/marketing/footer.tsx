import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-cream-200/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest text-cream">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <span className="font-serif text-lg font-semibold text-forest">Folio</span>
            </Link>
            <p className="mt-2 text-xs text-ink-muted max-w-xs leading-relaxed">
              Create beautiful digital flipbooks with rich text, images, and embedded videos.
              Share your stories with the world.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-ink uppercase tracking-wider">Platform</p>
              <Link href="/explore" className="text-sm text-ink-muted hover:text-ink transition-colors">Explore Books</Link>
              <Link href="/create" className="text-sm text-ink-muted hover:text-ink transition-colors">Create a Book</Link>
              <a href="mailto:info@techrealm.online" className="text-sm text-ink-muted hover:text-ink transition-colors">
                Support: info@techrealm.online
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between text-xs text-ink-faint">
          <p>© {new Date().getFullYear()} Folio. All rights reserved.</p>
          <p>This is an MVP app. Please bear with us.</p>
        </div>
      </div>
    </footer>
  )
}
