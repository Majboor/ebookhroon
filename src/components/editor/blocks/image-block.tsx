"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import type { ImageBlockData, BlockData } from "@/types"

interface ImageBlockProps {
  data: ImageBlockData
  onUpdate: (data: BlockData) => Promise<void>
  isEditing: boolean
}

export function ImageBlock({ data, onUpdate, isEditing }: ImageBlockProps) {
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [localAlt, setLocalAlt] = useState(data.alt)
  const [localCaption, setLocalCaption] = useState(data.caption ?? "")

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/upload", { method: "POST", body: formData })
    const json = await res.json()
    setUploading(false)

    if (json.url) {
      await onUpdate({ type: "IMAGE", url: json.url, alt: data.alt || file.name, caption: data.caption })
    } else {
      toast.error("Failed to upload image")
    }
  }

  // Read/view mode
  if (!isEditing) {
    if (!data.url) return null
    return (
      <figure className="my-2">
        <div className="relative rounded-lg overflow-hidden bg-cream-200">
          <img
            src={data.url}
            alt={data.alt}
            className="w-full h-auto object-contain max-h-80"
          />
        </div>
        {data.caption && (
          <figcaption className="text-center text-xs text-ink-muted mt-1.5 italic">
            {data.caption}
          </figcaption>
        )}
      </figure>
    )
  }

  // Editing mode
  if (!data.url) {
    return (
      <label className="block cursor-pointer">
        <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-10 hover:border-gold/50 hover:bg-gold/5 transition-colors text-center">
          {uploading ? (
            <>
              <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
              <p className="text-sm text-ink-muted">Uploading…</p>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full bg-cream-200 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-ink-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Click to upload image</p>
                <p className="text-xs text-ink-muted mt-0.5">JPG, PNG, WebP, GIF — max 10MB</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-forest">
                <Upload className="h-3.5 w-3.5" />
                Browse files
              </div>
            </>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    )
  }

  return (
    <div className="space-y-2">
      <figure className="relative group">
        <div className="relative rounded-lg overflow-hidden bg-cream-200">
          <img
            src={data.url}
            alt={data.alt}
            className="w-full h-auto object-contain max-h-80"
          />
          {/* Replace button */}
          <label className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/30 transition-colors cursor-pointer">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-paper/90 text-ink text-xs font-medium px-3 py-1.5 rounded-full">
              Replace image
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
          </label>
        </div>

        {/* Alt & caption */}
        <div className="mt-2 space-y-1.5">
          <input
            type="text"
            value={localAlt}
            onChange={(e) => setLocalAlt(e.target.value)}
            onBlur={() =>
              onUpdate({ type: "IMAGE", url: data.url, alt: localAlt, caption: localCaption || undefined })
            }
            placeholder="Alt text (for accessibility)…"
            className="w-full text-xs text-ink-muted bg-transparent border-b border-border/40 focus:border-gold/40 outline-none pb-1 transition-colors"
          />
          <input
            type="text"
            value={localCaption}
            onChange={(e) => setLocalCaption(e.target.value)}
            onBlur={() =>
              onUpdate({ type: "IMAGE", url: data.url, alt: localAlt, caption: localCaption || undefined })
            }
            placeholder="Caption (optional)…"
            className="w-full text-xs text-center text-ink-muted italic bg-transparent border-b border-border/40 focus:border-gold/40 outline-none pb-1 transition-colors"
          />
        </div>
      </figure>
    </div>
  )
}
