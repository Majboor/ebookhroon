"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft, ChevronRight, BookOpen, Maximize2, Minimize2,
  List, X, Home, ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { PageContent } from "./page-content"
import { cn } from "@/lib/utils"
import type { BookWithPages, PageWithBlocks } from "@/types"

interface FlipbookReaderProps {
  book: BookWithPages
}

// Build the list of "spreads" (pairs of pages visible at once)
// Spread 0: Cover (single, centered)
// Spread 1: pages[0] left + pages[1] right
// Spread 2: pages[2] left + pages[3] right
// etc.
function buildSpreads(pages: PageWithBlocks[]): Array<[PageWithBlocks | null, PageWithBlocks | null]> {
  const spreads: Array<[PageWithBlocks | null, PageWithBlocks | null]> = []
  spreads.push([null, null]) // cover spread
  for (let i = 0; i < pages.length; i += 2) {
    spreads.push([pages[i] ?? null, pages[i + 1] ?? null])
  }
  return spreads
}

type FlipDirection = "forward" | "backward"

export function FlipbookReader({ book }: FlipbookReaderProps) {
  const spreads = buildSpreads(book.pages)
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [direction, setDirection] = useState<FlipDirection>("forward")
  const [isAnimating, setIsAnimating] = useState(false)
  const [isTOCOpen, setIsTOCOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev()
      if (e.key === "Escape") setIsTOCOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }) // intentionally no deps — always fresh

  // Touch swipe
  const touchStart = useRef<number>(0)
  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const delta = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext()
      else goPrev()
    }
  }

  const goNext = useCallback(() => {
    if (isAnimating || spreadIndex >= spreads.length - 1) return
    setDirection("forward")
    setIsAnimating(true)
    setSpreadIndex((i) => i + 1)
  }, [isAnimating, spreadIndex, spreads.length])

  const goPrev = useCallback(() => {
    if (isAnimating || spreadIndex <= 0) return
    setDirection("backward")
    setIsAnimating(true)
    setSpreadIndex((i) => i - 1)
  }, [isAnimating, spreadIndex])

  function goToSpread(idx: number) {
    if (isAnimating || idx === spreadIndex) return
    setDirection(idx > spreadIndex ? "forward" : "backward")
    setIsAnimating(true)
    setSpreadIndex(idx)
    setIsTOCOpen(false)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    function handler() {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const currentSpread = spreads[spreadIndex]
  const [leftPage, rightPage] = currentSpread
  const isCover = spreadIndex === 0
  const totalSpreads = spreads.length
  const pageRange = isCover
    ? "Cover"
    : spreadIndex === totalSpreads - 1 && !rightPage
    ? `Page ${(leftPage?.pageNumber ?? 0)}`
    : `Pages ${leftPage?.pageNumber ?? ""}–${rightPage?.pageNumber ?? ""}`

  // Animation variants
  const pageVariants = {
    enterForward: { rotateY: -90, opacity: 0.3 },
    enterBackward: { rotateY: 90, opacity: 0.3 },
    center: { rotateY: 0, opacity: 1 },
    exitForward: { rotateY: 90, opacity: 0.3 },
    exitBackward: { rotateY: -90, opacity: 0.3 },
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#2B2118] flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#1A1410]/80 backdrop-blur-sm z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-serif text-sm font-semibold text-[#F5EFE6] leading-none truncate max-w-[200px] sm:max-w-xs">
              {book.title}
            </p>
            <p className="text-[10px] text-[#C9A84C]/70 mt-0.5">{book.authorName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#F5EFE6]/40 font-mono hidden sm:block">
            {pageRange}
          </span>
          {book.pages.length > 0 && (
            <button
              onClick={() => setIsTOCOpen(true)}
              className="p-2 text-[#F5EFE6]/50 hover:text-[#F5EFE6] transition-colors rounded hover:bg-white/10"
              title="Table of Contents"
            >
              <List className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-[#F5EFE6]/50 hover:text-[#F5EFE6] transition-colors rounded hover:bg-white/10"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ─── Book Stage ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative book-container">

        {/* Prev arrow */}
        <button
          onClick={goPrev}
          disabled={spreadIndex === 0 || isAnimating}
          className={cn(
            "absolute left-2 sm:left-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full",
            "flex items-center justify-center transition-all duration-200",
            "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white",
            "disabled:opacity-0 disabled:pointer-events-none",
            "shadow-lg backdrop-blur-sm"
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Book spread */}
        <div className="relative w-full max-w-5xl">
          <AnimatePresence
            mode="wait"
            onExitComplete={() => setIsAnimating(false)}
          >
            <motion.div
              key={spreadIndex}
              initial={direction === "forward" ? pageVariants.enterForward : pageVariants.enterBackward}
              animate={pageVariants.center}
              exit={direction === "forward" ? pageVariants.exitForward : pageVariants.exitBackward}
              transition={{
                duration: 0.55,
                ease: [0.645, 0.045, 0.355, 1.0],
              }}
              style={{ perspective: 2000 }}
            >
              {/* Mobile: single page stack */}
              {isMobile ? (
                <MobilePageView
                  leftPage={leftPage}
                  rightPage={rightPage}
                  isCover={isCover}
                  book={book}
                />
              ) : (
                <DesktopSpreadView
                  leftPage={leftPage}
                  rightPage={rightPage}
                  isCover={isCover}
                  book={book}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Next arrow */}
        <button
          onClick={goNext}
          disabled={spreadIndex >= spreads.length - 1 || isAnimating}
          className={cn(
            "absolute right-2 sm:right-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full",
            "flex items-center justify-center transition-all duration-200",
            "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white",
            "disabled:opacity-0 disabled:pointer-events-none",
            "shadow-lg backdrop-blur-sm"
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* ─── Bottom Progress ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 pb-4 flex-shrink-0">
        <span className="text-xs text-[#F5EFE6]/30 font-mono">
          {spreadIndex + 1} / {totalSpreads}
        </span>
        <div className="flex gap-1">
          {spreads.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSpread(i)}
              className={cn(
                "transition-all rounded-full",
                i === spreadIndex
                  ? "w-5 h-1.5 bg-[#C9A84C]"
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Go to spread ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ─── Table of Contents Drawer ────────────────────────────────────────── */}
      <AnimatePresence>
        {isTOCOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30"
              onClick={() => setIsTOCOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-[#1A1410] z-40 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h2 className="font-serif text-[#F5EFE6] font-semibold">Contents</h2>
                <button onClick={() => setIsTOCOpen(false)} className="text-[#F5EFE6]/40 hover:text-[#F5EFE6]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Cover */}
                <button
                  onClick={() => goToSpread(0)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                    spreadIndex === 0
                      ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                      : "text-[#F5EFE6]/60 hover:bg-white/5 hover:text-[#F5EFE6]"
                  )}
                >
                  <span className="font-serif font-medium">Cover</span>
                </button>

                {spreads.slice(1).map((spread, idx) => {
                  const [left, right] = spread
                  const spreadIdx = idx + 1
                  return (
                    <button
                      key={spreadIdx}
                      onClick={() => goToSpread(spreadIdx)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                        spreadIndex === spreadIdx
                          ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                          : "text-[#F5EFE6]/60 hover:bg-white/5 hover:text-[#F5EFE6]"
                      )}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="font-serif font-medium truncate max-w-[160px]">
                          {left?.title || `Page ${left?.pageNumber ?? ""}`}
                          {right && !right.title ? ` – ${right.pageNumber}` : ""}
                        </span>
                        <span className="text-[10px] text-[#F5EFE6]/30 font-mono ml-2 flex-shrink-0">
                          {left?.pageNumber}{right ? `–${right.pageNumber}` : ""}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Desktop: two-page spread ─────────────────────────────────────────────────

function DesktopSpreadView({
  leftPage,
  rightPage,
  isCover,
  book,
}: {
  leftPage: PageWithBlocks | null
  rightPage: PageWithBlocks | null
  isCover: boolean
  book: BookWithPages
}) {
  if (isCover) {
    return (
      <div className="flex items-center justify-center">
        <CoverPage book={book} />
      </div>
    )
  }

  return (
    <div className="flex items-stretch justify-center shadow-book rounded-sm overflow-hidden" style={{ minHeight: "560px" }}>
      {/* Left page */}
      <div className="w-1/2 max-w-[420px] relative bg-paper-texture">
        <div className="absolute inset-y-0 right-0 w-px bg-border/60 z-10" />
        {/* Spine shadow on left page right edge */}
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-10" />
        <div className="h-full overflow-y-auto">
          {leftPage ? (
            <BookPageView page={leftPage} side="left" />
          ) : (
            <BlankPage />
          )}
        </div>
      </div>

      {/* Right page */}
      <div className="w-1/2 max-w-[420px] relative bg-[#FFFDF9]">
        {/* Spine shadow on right page left edge */}
        <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10" />
        <div className="h-full overflow-y-auto">
          {rightPage ? (
            <BookPageView page={rightPage} side="right" />
          ) : (
            <BlankPage />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile: single page ──────────────────────────────────────────────────────

function MobilePageView({
  leftPage,
  rightPage,
  isCover,
  book,
}: {
  leftPage: PageWithBlocks | null
  rightPage: PageWithBlocks | null
  isCover: boolean
  book: BookWithPages
}) {
  if (isCover) return <CoverPage book={book} mobile />

  // On mobile show pages stacked
  return (
    <div className="space-y-4">
      {leftPage && (
        <div className="bg-paper rounded-xl shadow-book-sm overflow-hidden">
          <BookPageView page={leftPage} side="left" />
        </div>
      )}
      {rightPage && (
        <div className="bg-paper rounded-xl shadow-book-sm overflow-hidden">
          <BookPageView page={rightPage} side="right" />
        </div>
      )}
    </div>
  )
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

function CoverPage({ book, mobile }: { book: BookWithPages; mobile?: boolean }) {
  return (
    <div
      className={cn(
        "relative bg-forest text-cream flex flex-col justify-end overflow-hidden shadow-book",
        mobile ? "w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl" : "w-72 sm:w-80 aspect-[3/4] rounded-sm"
      )}
    >
      {book.coverImage ? (
        <img
          src={book.coverImage}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-forest-700 via-forest to-forest-900" />
      )}

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Folio watermark top */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <BookOpen className="h-3 w-3 text-[#C9A84C]/70" />
        <span className="text-[10px] font-serif text-[#C9A84C]/70 tracking-widest uppercase">Folio</span>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8">
        {book.category && (
          <p className="text-[10px] text-[#C9A84C] uppercase tracking-widest font-medium mb-3">
            {book.category}
          </p>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-white mb-2">
          {book.title}
        </h1>
        {book.subtitle && (
          <p className="text-sm text-white/70 mb-4 leading-relaxed">{book.subtitle}</p>
        )}
        <div className="flex items-center gap-2 pt-4 border-t border-white/20">
          <div className="h-5 w-5 rounded-full bg-[#C9A84C]/30 flex items-center justify-center text-[8px] font-bold text-[#C9A84C]">
            {book.authorName.charAt(0).toUpperCase()}
          </div>
          <p className="text-xs text-white/60">{book.authorName}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Book Page View ───────────────────────────────────────────────────────────

function BookPageView({ page, side }: { page: PageWithBlocks; side: "left" | "right" }) {
  return (
    <div className="min-h-full p-6 sm:p-8 bg-paper-texture flex flex-col relative" style={{ minHeight: "560px" }}>
      {/* Page content */}
      <div className="flex-1 reader-mode">
        <PageContent blocks={page.blocks} />
      </div>

      {/* Page number */}
      <div className={cn(
        "mt-6 pt-3 border-t border-border/40",
        side === "left" ? "text-left" : "text-right"
      )}>
        <span className="font-serif text-xs text-ink-faint italic">{page.pageNumber}</span>
      </div>
    </div>
  )
}

function BlankPage() {
  return (
    <div className="min-h-full bg-paper-texture flex items-center justify-center" style={{ minHeight: "560px" }}>
      <p className="text-xs text-ink-faint italic font-serif">This page intentionally left blank</p>
    </div>
  )
}
