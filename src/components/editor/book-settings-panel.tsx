"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { X, Upload, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateBook } from "@/lib/actions/books"
import { CATEGORIES, resolvePublicAssetUrl } from "@/lib/utils"
import type { Book } from "@/types"

interface BookSettingsPanelProps {
  book: Book
  onBookChange: (book: Partial<Book>) => void
  onClose: () => void
}

export function BookSettingsPanel({ book, onBookChange, onClose }: BookSettingsPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [coverPreview, setCoverPreview] = useState(book.coverImage ?? null)
  const [coverPath, setCoverPath] = useState(book.coverImage ?? "")
  const [uploading, setUploading] = useState(false)

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return }

    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    setUploading(false)
    const publicUrl = resolvePublicAssetUrl(data.url)
    if (publicUrl) { setCoverPath(publicUrl); setCoverPreview(publicUrl) }
    else toast.error("Upload failed")
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (coverPath) formData.set("coverImage", coverPath)

    startTransition(async () => {
      const result = await updateBook(book.id, formData)
      if (result.success) {
        onBookChange(result.data)
        toast.success("Settings saved")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <aside className="w-80 border-l border-border/60 bg-paper flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <h2 className="font-serif font-semibold text-ink">Book Settings</h2>
        <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <form id="settings-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Cover */}
          <div>
            <p className="text-sm font-medium text-ink mb-2">Cover Image</p>
            <div className="flex gap-3 items-start">
              <div className="relative w-16 h-22 rounded-lg overflow-hidden border border-border bg-cream-200 flex items-center justify-center flex-shrink-0" style={{ height: "88px" }}>
                {coverPreview
                  ? <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                  : <BookOpen className="h-6 w-6 text-ink-faint" />
                }
              </div>
              <label className="flex-1 cursor-pointer">
                <div className="px-3 py-2 rounded-lg border border-dashed border-border hover:border-gold/50 text-xs text-ink-muted flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : "Upload new cover"}
                </div>
                <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <Input name="title" label="Title" defaultValue={book.title} required />
          <Input name="subtitle" label="Subtitle" defaultValue={book.subtitle ?? ""} />
          <Input name="authorName" label="Author Name" defaultValue={book.authorName} required />

          <Textarea
            name="description"
            label="Description"
            defaultValue={book.description ?? ""}
            className="h-20 resize-none"
          />

          <div>
            <p className="text-sm font-medium text-ink mb-1.5">Category</p>
            <Select name="category" defaultValue={book.category ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>

      <div className="p-4 border-t border-border/40">
        <Button
          type="submit"
          form="settings-form"
          className="w-full"
          loading={isPending}
        >
          Save Settings
        </Button>
      </div>
    </aside>
  )
}
