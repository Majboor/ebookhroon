"use client"

import { useEffect, useRef } from "react"
import {
  Type, Image, Youtube, Quote, Minus, Heading, X
} from "lucide-react"
import type { BlockType } from "@/types"

const BLOCK_TYPES: {
  type: BlockType
  label: string
  description: string
  icon: React.ElementType
  color: string
}[] = [
  {
    type: "TEXT",
    label: "Text",
    description: "Rich paragraph with formatting",
    icon: Type,
    color: "bg-blue-100 text-blue-700",
  },
  {
    type: "HEADING",
    label: "Heading",
    description: "H1, H2, or H3 title",
    icon: Heading,
    color: "bg-purple-100 text-purple-700",
  },
  {
    type: "IMAGE",
    label: "Image",
    description: "Upload a photo with caption",
    icon: Image,
    color: "bg-green-100 text-green-700",
  },
  {
    type: "YOUTUBE",
    label: "YouTube",
    description: "Embed a YouTube video",
    icon: Youtube,
    color: "bg-red-100 text-red-700",
  },
  {
    type: "QUOTE",
    label: "Quote",
    description: "Pull quote with attribution",
    icon: Quote,
    color: "bg-amber-100 text-amber-700",
  },
  {
    type: "DIVIDER",
    label: "Divider",
    description: "Visual separator between sections",
    icon: Minus,
    color: "bg-gray-100 text-gray-600",
  },
]

interface BlockMenuProps {
  onSelect: (type: BlockType) => void
  onClose: () => void
}

export function BlockMenu({ onSelect, onClose }: BlockMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="bg-paper border border-border rounded-xl shadow-book-sm overflow-hidden w-72"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <p className="text-sm font-semibold text-ink">Insert a block</p>
        <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-2">
        {BLOCK_TYPES.map((item) => (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-cream-200 transition-colors group"
          >
            <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{item.label}</p>
              <p className="text-xs text-ink-muted">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
