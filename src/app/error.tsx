"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-cream p-8 text-center shadow-card">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-forest mb-3">
          App error
        </h1>
        <p className="text-ink-muted leading-relaxed mb-6">
          The page crashed while rendering. In Cloudflare this usually means the
          deployment target or runtime env is misconfigured.
        </p>
        <Button onClick={reset} size="lg">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
