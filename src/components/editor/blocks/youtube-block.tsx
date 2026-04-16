"use client"

import { useState } from "react"
import { Youtube, X, Play } from "lucide-react"
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/utils"
import type { YouTubeBlockData, BlockData } from "@/types"

interface YouTubeBlockProps {
  data: YouTubeBlockData
  onUpdate: (data: BlockData) => Promise<void>
  isEditing: boolean
}

export function YouTubeBlock({ data, onUpdate, isEditing }: YouTubeBlockProps) {
  const [urlInput, setUrlInput] = useState(data.url || "")
  const [showEmbed, setShowEmbed] = useState(false)
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const videoId = extractYouTubeId(urlInput)
    if (!videoId) {
      setError("Not a valid YouTube URL. Try: https://youtube.com/watch?v=...")
      return
    }
    setError("")
    onUpdate({ type: "YOUTUBE", videoId, url: urlInput })
  }

  // Read mode — embedded iframe
  if (!isEditing) {
    if (!data.videoId) return null
    return (
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${data.videoId}`}
          title={data.title ?? "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }

  // Editor mode with video set
  if (data.videoId) {
    return (
      <div className="space-y-2">
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black group">
          {showEmbed ? (
            <iframe
              src={`https://www.youtube.com/embed/${data.videoId}?autoplay=1`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <>
              <img
                src={getYouTubeThumbnail(data.videoId)}
                alt="YouTube thumbnail"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setShowEmbed(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
              >
                <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                </div>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-muted truncate max-w-[300px]">{data.url}</p>
          <button
            onClick={() => onUpdate({ type: "YOUTUBE", videoId: "", url: "" })}
            className="text-xs text-ink-faint hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        </div>
      </div>
    )
  }

  // Editor mode — URL input
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border bg-red-50/30">
        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <Youtube className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setError("") }}
            placeholder="Paste YouTube URL…  e.g. https://youtube.com/watch?v=..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
        >
          Embed
        </button>
      </div>
      <p className="text-xs text-ink-faint">
        Supports youtube.com/watch?v=... and youtu.be/... links
      </p>
    </form>
  )
}
