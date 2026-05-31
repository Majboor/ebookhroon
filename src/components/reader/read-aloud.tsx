"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Headphones, Pause, Play, Square, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BookWithPages, Block } from "@/types"

// ─── Text extraction ──────────────────────────────────────────────────────────
// Turn a book's pages/blocks into an ordered list of narratable segments. Each
// segment maps back to a page so we can show the reader what's being read.

interface NarrationSegment {
  pageNumber: number
  pageTitle: string
  text: string
}

function stripHtml(html: string): string {
  if (typeof window === "undefined" || !html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim()
}

function blockToText(block: Block): string {
  const data = block.data
  switch (data.type) {
    case "TEXT":
    case "HEADING":
    case "QUOTE":
      return stripHtml(data.content)
    case "IMAGE":
      return data.caption ? `Image: ${data.caption}` : ""
    case "YOUTUBE":
      return data.title ? `Video: ${data.title}` : ""
    default:
      return ""
  }
}

function buildSegments(book: BookWithPages): NarrationSegment[] {
  const segments: NarrationSegment[] = []
  const pages = [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber)
  for (const page of pages) {
    const blocks = [...page.blocks].sort((a, b) => a.order - b.order)
    const text = blocks.map(blockToText).filter(Boolean).join(". ")
    if (text.trim()) {
      segments.push({
        pageNumber: page.pageNumber,
        pageTitle: page.title || `Page ${page.pageNumber}`,
        text,
      })
    }
  }
  return segments
}

// ─── Component ─────────────────────────────────────────────────────────────────

type Status = "idle" | "playing" | "paused"

const SPEEDS = [1, 1.25, 1.5, 0.75] as const

export function ReadAloud({ book }: { book: BookWithPages }) {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [speed, setSpeed] = useState<number>(1)
  const speedRef = useRef(speed)
  const segIndexRef = useRef(0)

  const segments = useMemo(() => buildSegments(book), [book])

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        typeof window.SpeechSynthesisUtterance === "function"
    )
  }, [])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  // Cancel any in-flight narration when the reader unmounts.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speakFrom = useCallback(
    (index: number) => {
      if (index >= segments.length) {
        setStatus("idle")
        setSegmentIndex(0)
        segIndexRef.current = 0
        return
      }
      segIndexRef.current = index
      setSegmentIndex(index)

      const utterance = new SpeechSynthesisUtterance(segments[index].text)
      utterance.rate = speedRef.current
      utterance.pitch = 1
      utterance.onend = () => {
        // Advance only if we finished naturally (not cancelled by stop/pause).
        if (window.speechSynthesis.speaking) return
        speakFrom(segIndexRef.current + 1)
      }
      utterance.onerror = () => setStatus("idle")

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      setStatus("playing")
    },
    [segments]
  )

  const handlePlayPause = useCallback(() => {
    if (!supported || segments.length === 0) return
    const synth = window.speechSynthesis
    if (status === "idle") {
      speakFrom(segIndexRef.current || 0)
    } else if (status === "playing") {
      synth.pause()
      setStatus("paused")
    } else if (status === "paused") {
      synth.resume()
      setStatus("playing")
    }
  }, [supported, segments.length, status, speakFrom])

  const handleStop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setStatus("idle")
    setSegmentIndex(0)
    segIndexRef.current = 0
  }, [supported])

  const cycleSpeed = useCallback(() => {
    const next = SPEEDS[(SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length]
    setSpeed(next)
    speedRef.current = next
    // If currently narrating, restart the current segment at the new rate.
    if (status !== "idle") {
      speakFrom(segIndexRef.current)
    }
  }, [speed, status, speakFrom])

  if (!supported || segments.length === 0) return null

  const active = status !== "idle"
  const current = segments[segmentIndex]

  return (
    <div
      data-testid="read-aloud"
      className="fixed bottom-4 left-4 z-30 flex items-center gap-1 select-none"
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-full pl-1 pr-1 py-1 shadow-2xl backdrop-blur-md transition-colors",
          active
            ? "bg-[#1A1410]/95 ring-1 ring-[#C9A84C]/40"
            : "bg-[#1A1410]/80 ring-1 ring-white/10"
        )}
      >
        <button
          onClick={handlePlayPause}
          data-testid="read-aloud-toggle"
          title={
            status === "playing"
              ? "Pause narration"
              : status === "paused"
              ? "Resume narration"
              : "Listen to this book"
          }
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors",
            active
              ? "bg-[#C9A84C] text-[#1A1410] hover:bg-[#d8b95c]"
              : "text-[#F5EFE6]/80 hover:text-[#F5EFE6] hover:bg-white/10"
          )}
        >
          {status === "playing" ? (
            <Pause className="h-4 w-4" />
          ) : status === "paused" ? (
            <Play className="h-4 w-4" />
          ) : (
            <Headphones className="h-4 w-4" />
          )}
          <span className="whitespace-nowrap">
            {status === "playing"
              ? "Reading…"
              : status === "paused"
              ? "Paused"
              : "Listen"}
          </span>
        </button>

        {active && (
          <>
            <button
              onClick={handleStop}
              data-testid="read-aloud-stop"
              title="Stop narration"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#F5EFE6]/60 hover:text-[#F5EFE6] hover:bg-white/10 transition-colors"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={cycleSpeed}
              data-testid="read-aloud-speed"
              title="Playback speed"
              className="flex h-9 items-center gap-1 rounded-full px-2.5 text-[11px] font-mono text-[#C9A84C] hover:bg-white/10 transition-colors"
            >
              <Gauge className="h-3.5 w-3.5" />
              {speed}×
            </button>
          </>
        )}
      </div>

      {active && current && (
        <div className="ml-2 hidden max-w-[220px] items-center rounded-full bg-[#1A1410]/80 px-3 py-1.5 text-[11px] text-[#F5EFE6]/60 shadow-lg backdrop-blur-md sm:flex">
          <span className="truncate">
            {current.pageTitle}
            <span className="text-[#F5EFE6]/30">
              {" "}
              · {segmentIndex + 1}/{segments.length}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
