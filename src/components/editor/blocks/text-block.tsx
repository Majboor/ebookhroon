"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import { useEffect, useRef } from "react"
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TextBlockData, BlockData } from "@/types"

interface TextBlockProps {
  data: TextBlockData
  onUpdate: (data: BlockData) => Promise<void>
  isEditing: boolean
}

export function TextBlock({ data, onUpdate, isEditing }: TextBlockProps) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // handled by HeadingBlock
      }),
      Underline,
      TextAlign.configure({ types: ["paragraph"] }),
      Placeholder.configure({
        placeholder: "Start writing your paragraph…",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: data.content,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        onUpdate({ type: "TEXT", content: editor.getHTML() })
      }, 500)
    },
  })

  // Sync external data changes
  useEffect(() => {
    if (editor && editor.getHTML() !== data.content) {
      editor.commands.setContent(data.content, false)
    }
  }, [data.content]) // eslint-disable-line

  if (!isEditing) {
    return (
      <div
        className="book-page-content"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    )
  }

  return (
    <div className="tiptap-editor rounded-lg border border-transparent hover:border-border focus-within:border-gold/40 focus-within:ring-1 focus-within:ring-gold/20 transition-all">
      {/* Toolbar */}
      {editor && (
        <div className="flex flex-wrap gap-0.5 px-2 pt-2 pb-1.5 border-b border-border/40">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1 self-center" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1 self-center" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1 self-center" />

          <ToolbarButton
            onClick={() => {
              const url = window.prompt("Enter URL")
              if (url) editor.chain().focus().setLink({ href: url }).run()
            }}
            active={editor.isActive("link")}
            title="Add Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      )}

      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={cn(
        "h-7 w-7 rounded flex items-center justify-center transition-colors",
        active
          ? "bg-forest text-cream"
          : "text-ink-muted hover:bg-cream-300 hover:text-ink"
      )}
    >
      {children}
    </button>
  )
}
