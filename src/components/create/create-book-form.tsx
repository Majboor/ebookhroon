"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BookOpen, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBook } from "@/lib/actions/books"
import { CATEGORIES, resolvePublicAssetUrl } from "@/lib/utils"

interface CreateBookFormProps {
  defaultAuthorName?: string
}

export function CreateBookForm({ defaultAuthorName = "" }: CreateBookFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverPath, setCoverPath] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image must be under 5MB")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/upload", { method: "POST", body: formData })
    const data = await res.json()
    setUploading(false)

    const publicUrl = resolvePublicAssetUrl(data.url)

    if (publicUrl) {
      setCoverPath(publicUrl)
      setCoverPreview(publicUrl)
    } else {
      toast.error("Failed to upload cover image")
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (coverPath) formData.set("coverImage", coverPath)

    const title = formData.get("title") as string
    const authorName = formData.get("authorName") as string
    const newErrors: Record<string, string> = {}

    if (!title?.trim()) newErrors.title = "Title is required"
    if (!authorName?.trim()) newErrors.authorName = "Author name is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    startTransition(async () => {
      const result = await createBook(formData)
      if (result.success) {
        toast.success("Book created! Opening editor…")
        router.push(`/edit/${result.data.bookId}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Cover image */}
      <div>
        <p className="text-sm font-medium text-ink mb-2">Cover Image <span className="text-ink-faint">(optional)</span></p>
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-border bg-cream-200 flex items-center justify-center flex-shrink-0">
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverPreview(null); setCoverPath("") }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-ink/60 text-white flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <BookOpen className="h-8 w-8 text-ink-faint" />
            )}
          </div>
          <div className="flex-1">
            <label className="block cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border hover:border-gold hover:bg-gold/5 transition-colors text-sm text-ink-muted">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload cover image"}
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleCoverUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-ink-faint mt-1.5">JPG, PNG, or WebP. Max 5MB. Ideal ratio: 3:4.</p>
          </div>
        </div>
      </div>

      <Input
        name="title"
        label="Book Title"
        placeholder="The Great Journey"
        error={errors.title}
        required
      />

      <Input
        name="subtitle"
        label="Subtitle"
        placeholder="A story about adventure and discovery (optional)"
      />

      <Input
        name="authorName"
        label="Author Name"
        placeholder="Your name or pen name"
        defaultValue={defaultAuthorName}
        error={errors.authorName}
        required
      />

      <Textarea
        name="description"
        label="Description"
        placeholder="What is this book about? (optional)"
        className="h-24 resize-none"
      />

      <div>
        <p className="text-sm font-medium text-ink mb-1.5">Category</p>
        <Select name="category">
          <SelectTrigger>
            <SelectValue placeholder="Choose a category (optional)" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={isPending}
      >
        Create Book & Open Editor
      </Button>
    </form>
  )
}
