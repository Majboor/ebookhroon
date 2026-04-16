"use client"

import { useState, useCallback, useOptimistic } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  BookOpen, Eye, Settings, ArrowLeft, Globe, Lock, Loader2, CheckCircle2, LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageSidebar } from "./page-sidebar"
import { PageCanvas } from "./page-canvas"
import { BookSettingsPanel } from "./book-settings-panel"
import { addPage } from "@/lib/actions/pages"
import { publishBook, unpublishBook } from "@/lib/actions/books"
import type { BookWithPages, PageWithBlocks } from "@/types"
import { cn } from "@/lib/utils"
import { ShareBookButton } from "@/components/books/share-book-button"

interface BookEditorProps {
  initialBook: BookWithPages
}

export function BookEditor({ initialBook }: BookEditorProps) {
  const router = useRouter()
  const [book, setBook] = useState<BookWithPages>(initialBook)
  const [activePageId, setActivePageId] = useState<string | null>(
    initialBook.pages[0]?.id ?? null
  )
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const activePage = book.pages.find((p) => p.id === activePageId) ?? null

  // Update a specific page in our local state
  const updatePage = useCallback((updatedPage: PageWithBlocks) => {
    setBook((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === updatedPage.id ? updatedPage : p)),
    }))
  }, [])

  // Update all pages (for reordering)
  const updatePages = useCallback((updatedPages: PageWithBlocks[]) => {
    setBook((prev) => ({ ...prev, pages: updatedPages }))
  }, [])

  async function handleAddPage() {
    const currentPageNumbers = book.pages.map((p) => p.pageNumber)
    const afterPageNumber = activePage?.pageNumber ?? Math.max(0, ...currentPageNumbers)

    const result = await addPage(book.id, afterPageNumber)
    if (result.success) {
      const newPage: PageWithBlocks = { ...result.data, blocks: [] }
      const insertAfter = book.pages.findIndex(
        (p) => p.pageNumber === afterPageNumber
      )
      const newPages = [...book.pages]
      // Renumber pages that shifted
      const shifted = newPages.map((p) => ({
        ...p,
        pageNumber:
          p.pageNumber > afterPageNumber ? p.pageNumber + 1 : p.pageNumber,
      }))
      shifted.splice(insertAfter + 1, 0, newPage)
      setBook((prev) => ({
        ...prev,
        pages: shifted.sort((a, b) => a.pageNumber - b.pageNumber),
      }))
      setActivePageId(newPage.id)
      toast.success("Page added")
    } else {
      toast.error(result.error)
    }
  }

  async function handlePublishToggle() {
    setPublishing(true)
    const result =
      book.status === "published"
        ? await unpublishBook(book.id)
        : await publishBook(book.id)
    setPublishing(false)

    if (result.success) {
      setBook((prev) => ({ ...prev, status: result.data.status }))
      toast.success(
        result.data.status === "published"
          ? "Book published! It's now public."
          : "Book unpublished. It's now a draft."
      )
    } else {
      toast.error(result.error)
    }
  }

  const isPublished = book.status === "published"

  return (
    <div className="h-screen flex flex-col bg-cream overflow-hidden">
      {/* ─── Top Bar ──────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-border/60 bg-paper flex items-center justify-between px-4 flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <BookOpen className="h-4 w-4" />
            <span className="font-serif text-sm font-semibold text-forest hidden sm:block">
              Folio
            </span>
          </Link>

          <div className="h-5 w-px bg-border" />

          <div className="flex flex-col">
            <span className="font-serif text-sm font-semibold text-ink leading-tight truncate max-w-[200px] sm:max-w-sm">
              {book.title}
            </span>
            <span className="text-[10px] text-ink-muted">{book.authorName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save indicator */}
          <div className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            saving ? "text-amber-600" : "text-emerald-600"
          )}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:block">{saving ? "Saving…" : "Saved"}</span>
          </div>

          <div className="h-5 w-px bg-border" />

          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Dashboard</span>
            </Link>
          </Button>

          <Badge variant={isPublished ? "published" : "draft"}>
            {isPublished ? (
              <><Globe className="h-3 w-3" /> Published</>
            ) : (
              <><Lock className="h-3 w-3" /> Draft</>
            )}
          </Badge>

          {/* Preview */}
          {isPublished && (
            <>
              <ShareBookButton slug={book.slug} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/read/${book.slug}`} target="_blank">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:block">Preview</span>
                </Link>
              </Button>
            </>
          )}

          {/* Settings */}
          <Button
            variant={showSettings ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Settings</span>
          </Button>

          {/* Publish toggle */}
          <Button
            size="sm"
            variant={isPublished ? "secondary" : "default"}
            onClick={handlePublishToggle}
            loading={publishing}
          >
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </header>

      {/* ─── Main Area ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <PageSidebar
          book={book}
          activePageId={activePageId}
          onSelectPage={setActivePageId}
          onAddPage={handleAddPage}
          onPagesChange={updatePages}
        />

        {/* Canvas */}
        <main className="flex-1 overflow-auto">
          {activePage ? (
            <PageCanvas
              page={activePage}
              bookId={book.id}
              onPageChange={updatePage}
              onSavingChange={setSaving}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <BookOpen className="h-12 w-12 text-ink-faint mb-4" />
              <h3 className="font-serif text-xl font-semibold text-ink mb-2">
                No pages yet
              </h3>
              <p className="text-ink-muted text-sm mb-5">
                Add your first page to start writing.
              </p>
              <Button onClick={handleAddPage}>Add First Page</Button>
            </div>
          )}
        </main>

        {/* Settings panel */}
        {showSettings && (
          <BookSettingsPanel
            book={book}
            onBookChange={(updated) => setBook((prev) => ({ ...prev, ...updated }))}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  )
}
