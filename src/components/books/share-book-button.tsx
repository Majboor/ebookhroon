"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface ShareBookButtonProps {
  slug: string
  size?: "sm" | "default" | "lg"
  className?: string
}

export function ShareBookButton({
  slug,
  size = "sm",
  className,
}: ShareBookButtonProps) {
  async function handleShare() {
    const shareUrl = `${window.location.origin}/read/${slug}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Share link copied")
    } catch {
      toast.error("Could not copy the share link")
    }
  }

  return (
    <Button variant="outline" size={size} className={className} onClick={handleShare}>
      <Share2 className="h-3.5 w-3.5" />
      Share Link
    </Button>
  )
}
