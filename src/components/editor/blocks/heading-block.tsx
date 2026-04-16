"use client"

import { useState } from "react"
import type { HeadingBlockData, BlockData } from "@/types"

interface HeadingBlockProps {
  data: HeadingBlockData
  onUpdate: (data: BlockData) => Promise<void>
  isEditing: boolean
}

const TAG_CLASSES = {
  1: "text-3xl font-bold",
  2: "text-2xl font-semibold",
  3: "text-xl font-semibold",
}

export function HeadingBlock({ data, onUpdate, isEditing }: HeadingBlockProps) {
  const [level, setLevel] = useState<1 | 2 | 3>(data.level)

  if (!isEditing) {
    const Tag = `h${data.level}` as "h1" | "h2" | "h3"
    return (
      <Tag className={`font-serif text-ink leading-tight ${TAG_CLASSES[data.level]}`}>
        {data.content}
      </Tag>
    )
  }

  return (
    <div className="space-y-2">
      {/* Level selector */}
      <div className="flex gap-1">
        {([1, 2, 3] as const).map((l) => (
          <button
            key={l}
            onClick={() => {
              setLevel(l)
              onUpdate({ ...data, level: l })
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold font-serif transition-colors ${
              level === l
                ? "bg-forest text-cream"
                : "bg-cream-200 text-ink-muted hover:bg-cream-300"
            }`}
          >
            H{l}
          </button>
        ))}
      </div>

      <input
        type="text"
        defaultValue={data.content}
        placeholder="Enter heading…"
        onBlur={(e) =>
          onUpdate({ type: "HEADING", content: e.target.value, level })
        }
        className={`w-full bg-transparent font-serif text-ink outline-none border-b-2 border-transparent focus:border-gold/40 transition-colors pb-1 ${TAG_CLASSES[level]}`}
      />
    </div>
  )
}
