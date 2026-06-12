import { cn } from "@/lib/utils"

interface AuroraBackdropProps {
  className?: string
}

/**
 * Soft, slowly-drifting aurora blobs + a faint grain wash for the hero.
 * Purely decorative and non-interactive; all motion is CSS and is paused for
 * users who prefer reduced motion.
 */
export function AuroraBackdrop({ className }: AuroraBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      <div className="aurora-blob aurora-blob--float -top-32 -right-24 h-[28rem] w-[28rem] bg-gold/25" />
      <div className="aurora-blob aurora-blob--float-alt -bottom-40 -left-24 h-[30rem] w-[30rem] bg-forest/20" />
      <div className="aurora-blob top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 bg-gold-200/20" />
      {/* Fine grain wash to keep the gradient from looking flat */}
      <div className="absolute inset-0 bg-paper-texture opacity-40 mix-blend-multiply" />
    </div>
  )
}
