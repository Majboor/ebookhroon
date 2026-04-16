"use client"

import type { Block, BlockData } from "@/types"
import { TextBlock } from "./blocks/text-block"
import { HeadingBlock } from "./blocks/heading-block"
import { ImageBlock } from "./blocks/image-block"
import { YouTubeBlock } from "./blocks/youtube-block"
import { QuoteBlock } from "./blocks/quote-block"
import { DividerBlock } from "./blocks/divider-block"

interface BlockRendererProps {
  block: Block
  onUpdate?: (data: BlockData) => Promise<void>
  isEditing?: boolean
}

export function BlockRenderer({ block, onUpdate, isEditing = false }: BlockRendererProps) {
  const commonProps = {
    data: block.data,
    onUpdate: onUpdate ?? (async () => {}),
    isEditing,
  }

  switch (block.type) {
    case "TEXT":
      return <TextBlock {...commonProps} data={block.data as any} />
    case "HEADING":
      return <HeadingBlock {...commonProps} data={block.data as any} />
    case "IMAGE":
      return <ImageBlock {...commonProps} data={block.data as any} />
    case "YOUTUBE":
      return <YouTubeBlock {...commonProps} data={block.data as any} />
    case "QUOTE":
      return <QuoteBlock {...commonProps} data={block.data as any} />
    case "DIVIDER":
      return <DividerBlock {...commonProps} data={block.data as any} />
    default:
      return null
  }
}
