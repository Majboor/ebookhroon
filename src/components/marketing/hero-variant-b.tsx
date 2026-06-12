import Link from "next/link"
import { ArrowRight, Sparkles, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Hero — Variant B (A/B test).
 *
 * A distinct alternative to the default centered hero rendered in
 * `src/app/page.tsx`. Where variant A is a centered, symmetrical layout with
 * a "Your stories, beautifully bound." headline and a two-CTA row, variant B
 * is an asymmetric split: benefit-led headline copy on the left, the flipbook
 * mockup on the right, a dark editorial backdrop, and a single primary CTA
 * paired with a low-emphasis text link.
 *
 * Rendered when the landing page is visited with `?variant=b`.
 */
export function HeroVariantB() {
  return (
    <section className="relative overflow-hidden bg-gradient-forest text-cream pt-20 pb-24 lg:pt-24 lg:pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 right-0 w-[28rem] h-[28rem] rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-96 h-96 rounded-full bg-cream/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* ── Copy column (left) ── */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold-300 mb-8">
              <Sparkles className="h-3 w-3 fill-current" />
              Free to start — no credit card
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-balance mb-6">
              Publish a book the
              <br className="hidden sm:block" />{" "}
              world can{" "}
              <span className="text-gold-400 italic">actually read.</span>
            </h1>

            <p className="mx-auto lg:mx-0 max-w-xl text-lg text-cream-300 leading-relaxed mb-10">
              Turn your words, images, and videos into a real page-turning
              flipbook in minutes — then share it with a single link. No design
              skills required.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <Button asChild size="xl" variant="gold" className="shadow-lg">
                <Link href="/create">
                  <PenLine className="h-5 w-5" />
                  Start Writing Free
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="ghost"
                className="text-cream-200 hover:text-cream hover:bg-cream/10"
              >
                <Link href="/explore">
                  See example books
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-xs text-cream-400">
              Join writers, educators, and creators publishing with Folio.
            </p>
          </div>

          {/* ── Mockup column (right) ── */}
          <div className="mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative rounded-2xl overflow-hidden shadow-book bg-paper/95 p-1 rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="rounded-xl overflow-hidden bg-paper flex">
                {/* Left page */}
                <div className="w-1/2 min-h-[300px] bg-paper p-8 border-r border-border/40 relative">
                  <div className="book-spine-shadow absolute inset-0 pointer-events-none" />
                  <div className="h-3 w-16 bg-gold/30 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-2 bg-ink/10 rounded w-full" />
                    <div className="h-2 bg-ink/10 rounded w-5/6" />
                    <div className="h-2 bg-ink/10 rounded w-full" />
                    <div className="h-2 bg-ink/10 rounded w-4/5" />
                  </div>
                  <div className="mt-5 h-20 bg-cream-200 rounded-lg" />
                  <div className="mt-4 space-y-2">
                    <div className="h-2 bg-ink/10 rounded w-full" />
                    <div className="h-2 bg-ink/10 rounded w-3/4" />
                  </div>
                  <p className="absolute bottom-4 left-8 text-xs text-ink-faint font-serif">1</p>
                </div>

                {/* Right page */}
                <div className="w-1/2 min-h-[300px] bg-paper-texture p-8 relative">
                  <div className="h-5 w-28 bg-forest/15 rounded mb-5 font-serif" />
                  <div className="space-y-2">
                    <div className="h-2 bg-ink/10 rounded w-full" />
                    <div className="h-2 bg-ink/10 rounded w-full" />
                    <div className="h-2 bg-ink/10 rounded w-2/3" />
                  </div>
                  <div className="mt-5 p-3 border-l-4 border-gold/60 bg-gold/5 rounded-r-lg">
                    <div className="h-2 bg-gold/30 rounded w-full" />
                    <div className="h-2 bg-gold/30 rounded w-4/5 mt-1.5" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 bg-ink/10 rounded w-full" />
                    <div className="h-2 bg-ink/10 rounded w-5/6" />
                    <div className="h-2 bg-ink/10 rounded w-full" />
                  </div>
                  <p className="absolute bottom-4 right-8 text-xs text-ink-faint font-serif">2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
