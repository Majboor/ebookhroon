import { Play } from "lucide-react"
import { getYouTubeThumbnail } from "@/lib/utils"
import type { Block } from "@/types"

interface PageContentProps {
  blocks: Block[]
}

export function PageContent({ blocks }: PageContentProps) {
  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-ink-faint italic font-serif">Empty page</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "TEXT": {
      const d = block.data as { type: "TEXT"; content: string }
      return (
        <div
          className="book-page-content"
          dangerouslySetInnerHTML={{ __html: d.content }}
        />
      )
    }

    case "HEADING": {
      const d = block.data as { type: "HEADING"; content: string; level: 1 | 2 | 3 }
      const classes = {
        1: "text-xl sm:text-2xl font-bold mb-3 mt-1",
        2: "text-lg sm:text-xl font-semibold mb-2 mt-1",
        3: "text-base sm:text-lg font-semibold mb-2 mt-1",
      }[d.level]
      const Tag = `h${d.level}` as "h1" | "h2" | "h3"
      return (
        <Tag className={`font-serif text-ink leading-tight ${classes}`}>
          {d.content}
        </Tag>
      )
    }

    case "IMAGE": {
      const d = block.data as { type: "IMAGE"; url: string; alt: string; caption?: string }
      if (!d.url) return null
      return (
        <figure className="my-3">
          <div className="rounded-lg overflow-hidden bg-cream-200">
            <img
              src={d.url}
              alt={d.alt}
              className="w-full h-auto object-contain max-h-64"
              loading="lazy"
            />
          </div>
          {d.caption && (
            <figcaption className="text-center text-xs text-ink-muted mt-1.5 italic">
              {d.caption}
            </figcaption>
          )}
        </figure>
      )
    }

    case "YOUTUBE": {
      const d = block.data as { type: "YOUTUBE"; videoId: string; url: string; title?: string }
      if (!d.videoId) return null
      return (
        <div className="my-3">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${d.videoId}`}
              title={d.title ?? "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )
    }

    case "QUOTE": {
      const d = block.data as { type: "QUOTE"; content: string; attribution?: string }
      return (
        <blockquote className="border-l-4 border-gold/60 pl-4 py-1 my-3 bg-gold/5 rounded-r-lg">
          <p className="text-xs sm:text-sm text-ink-light italic leading-relaxed">{d.content}</p>
          {d.attribution && (
            <cite className="block text-xs text-ink-muted mt-1.5 not-italic">
              — {d.attribution}
            </cite>
          )}
        </blockquote>
      )
    }

    case "DIVIDER": {
      const d = block.data as { type: "DIVIDER"; style?: string }
      if (d.style === "ornament") {
        return (
          <div className="flex items-center justify-center py-3">
            <span className="text-gold/40 text-base tracking-widest select-none">✦ ✦ ✦</span>
          </div>
        )
      }
      return (
        <div className="py-3">
          <hr className={`border-t ${
            d.style === "dashed"
              ? "border-dashed border-border"
              : d.style === "dots"
              ? "border-dotted border-border"
              : "border-border"
          }`} />
        </div>
      )
    }

    default:
      return null
  }
}
