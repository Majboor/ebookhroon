"use client"

import { useState } from "react"
import type { QuoteBlockData, BlockData } from "@/types"

interface QuoteBlockProps {
  data: QuoteBlockData
  onUpdate: (data: BlockData) => Promise<void>
  isEditing: boolean
}

export function QuoteBlock({ data, onUpdate, isEditing }: QuoteBlockProps) {
  const [content, setContent] = useState(data.content)
  const [attribution, setAttribution] = useState(data.attribution ?? "")

  if (!isEditing) {
    return (
      <blockquote className="border-l-4 border-gold/60 pl-5 py-2 my-3 italic">
        <p className="text-ink-light leading-relaxed">{data.content}</p>
        {data.attribution && (
          <cite className="block text-sm text-ink-muted mt-2 not-italic font-medium">
            — {data.attribution}
          </cite>
        )}
      </blockquote>
    )
  }

  return (
    <div className="border-l-4 border-gold/60 pl-5 py-2 space-y-2 bg-gold/5 rounded-r-lg">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() =>
          onUpdate({ type: "QUOTE", content, attribution: attribution || undefined })
        }
        placeholder="Enter quote text…"
        rows={3}
        className="w-full text-ink-light italic bg-transparent outline-none resize-none text-sm leading-relaxed placeholder:text-ink-faint placeholder:not-italic"
      />
      <input
        type="text"
        value={attribution}
        onChange={(e) => setAttribution(e.target.value)}
        onBlur={() =>
          onUpdate({ type: "QUOTE", content, attribution: attribution || undefined })
        }
        placeholder="— Attribution (optional)"
        className="w-full text-sm text-ink-muted bg-transparent outline-none border-t border-gold/20 pt-2 placeholder:text-ink-faint"
      />
    </div>
  )
}
