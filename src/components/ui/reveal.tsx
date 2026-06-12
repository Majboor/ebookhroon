"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay in ms before the reveal transition starts (for staggering). */
  delay?: number
  /** Render as a different element while keeping the reveal behaviour. */
  as?: React.ElementType
}

/**
 * Scroll-reveal wrapper. Children start slightly offset + transparent and ease
 * into place the first time they scroll into view. Uses IntersectionObserver so
 * it is cheap and fires once. Falls back to fully-visible when the observer is
 * unavailable or the user prefers reduced motion (handled in CSS).
 */
export function Reveal({ delay = 0, as: Tag = "div", className, style, children, ...props }: RevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }

    // If the element is already within (or near) the viewport on mount, reveal
    // immediately so above-the-fold content never waits on a scroll event.
    const rect = node.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    if (rect.top < vh * 0.95) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )

    observer.observe(node)

    // Failsafe: never leave content permanently hidden if the observer never
    // fires (e.g. the section is programmatically scrolled past, or an edge-case
    // layout keeps it out of the intersection root). Content wins over motion.
    const failsafe = window.setTimeout(() => setVisible(true), 2500)

    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [])

  return (
    <Tag
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  )
}
