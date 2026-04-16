"use client"

import type { DividerBlockData, BlockData } from "@/types"

interface DividerBlockProps {
  data: DividerBlockData
  onUpdate: (data: BlockData) => Promise<void>
  isEditing: boolean
}

export function DividerBlock({ data, onUpdate, isEditing }: DividerBlockProps) {
  const style = data.style ?? "solid"

  const lineClass = {
    solid: "border-border",
    dashed: "border-dashed border-border",
    dots: "border-dotted border-border",
    ornament: "border-none",
  }[style]

  if (style === "ornament") {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-gold/60 text-xl tracking-widest select-none">✦ ✦ ✦</span>
      </div>
    )
  }

  return (
    <div className="py-3">
      <hr className={`border-t ${lineClass}`} />
      {isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-ink-faint">Style:</span>
          {(["solid", "dashed", "dots", "ornament"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ type: "DIVIDER", style: s })}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                style === s
                  ? "bg-forest text-cream"
                  : "bg-cream-200 text-ink-muted hover:bg-cream-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
