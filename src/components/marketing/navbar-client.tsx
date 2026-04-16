"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, LayoutDashboard, LogIn, LogOut, Menu, PenSquare, UserPlus, X } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { logoutUser } from "@/lib/actions/auth"
import type { User } from "@/types"

interface NavbarClientProps {
  currentUser: User | null
}

export function NavbarClient({ currentUser }: NavbarClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const navLinks = currentUser
    ? [
        { href: "/explore", label: "Explore" },
        { href: "/dashboard", label: "Dashboard" },
      ]
    : [{ href: "/explore", label: "Explore" }]

  function handleLogout() {
    startTransition(async () => {
      const result = await logoutUser()
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success("Signed out")
      router.refresh()
      setMobileOpen(false)
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-cream shadow-sm group-hover:shadow transition-shadow">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-serif text-xl font-semibold text-forest tracking-tight">
              Folio
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-forest bg-forest/8"
                    : "text-ink-light hover:text-ink hover:bg-cream-200"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-border bg-paper px-3 py-1.5">
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-ink">{currentUser.username}</p>
                    <p className="text-[11px] text-ink-faint">{currentUser.email}</p>
                  </div>
                  <Badge variant={currentUser.role === "admin" ? "gold" : "cream"}>
                    {currentUser.role}
                  </Badge>
                </div>
                <Button asChild size="sm" className="shadow-sm">
                  <Link href="/create">
                    <PenSquare className="h-3.5 w-3.5" />
                    New Flipbook
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} loading={isPending}>
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">
                    <LogIn className="h-3.5 w-3.5" />
                    Login
                  </Link>
                </Button>
                <Button asChild size="sm" className="shadow-sm">
                  <Link href="/register">
                    <UserPlus className="h-3.5 w-3.5" />
                    Create Account
                  </Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-ink-light hover:text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-cream px-4 pb-4 pt-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium",
                pathname === link.href
                  ? "text-forest bg-forest/8"
                  : "text-ink-light hover:bg-cream-200"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {currentUser ? (
            <div className="pt-3 space-y-3">
              <div className="rounded-xl border border-border bg-paper px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{currentUser.username}</p>
                    <p className="truncate text-xs text-ink-faint">{currentUser.email}</p>
                  </div>
                  <Badge variant={currentUser.role === "admin" ? "gold" : "cream"}>
                    {currentUser.role}
                  </Badge>
                </div>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/create" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Create Flipbook
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={handleLogout} loading={isPending}>
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="pt-3 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  Create Account
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
