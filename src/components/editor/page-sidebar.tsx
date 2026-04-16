"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import {
  Plus, Trash2, Copy, GripVertical, FileText
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { deletePage, reorderPages, duplicatePage } from "@/lib/actions/pages"
import { cn } from "@/lib/utils"
import type { BookWithPages, PageWithBlocks } from "@/types"

interface PageSidebarProps {
  book: BookWithPages
  activePageId: string | null
  onSelectPage: (id: string) => void
  onAddPage: () => Promise<void>
  onPagesChange: (pages: PageWithBlocks[]) => void
}

interface SortablePageItemProps {
  page: PageWithBlocks
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SortablePageItem({
  page,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
}: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border cursor-pointer transition-all",
        isActive
          ? "border-forest/40 bg-forest/5 shadow-sm"
          : "border-transparent hover:border-border hover:bg-cream-200/50",
        isDragging && "opacity-50 shadow-lg z-10"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2 p-2">
        {/* Drag handle */}
        <button
          className="mt-0.5 p-0.5 text-ink-faint hover:text-ink-muted opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Page thumbnail */}
        <div className="flex-1 min-w-0">
          <div className="aspect-[3/4] w-full rounded bg-paper border border-border/60 overflow-hidden mb-1.5 flex flex-col p-1.5 relative">
            {/* Mini content preview */}
            {page.blocks.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <FileText className="h-4 w-4 text-ink-faint" />
              </div>
            ) : (
              <div className="space-y-1">
                {page.blocks.slice(0, 4).map((block) => (
                  <div key={block.id} className="w-full">
                    {block.type === "HEADING" && (
                      <div className="h-1.5 bg-ink/20 rounded w-3/4" />
                    )}
                    {block.type === "TEXT" && (
                      <div className="space-y-0.5">
                        <div className="h-1 bg-ink/10 rounded w-full" />
                        <div className="h-1 bg-ink/10 rounded w-5/6" />
                        <div className="h-1 bg-ink/10 rounded w-4/5" />
                      </div>
                    )}
                    {block.type === "IMAGE" && (
                      <div className="h-5 bg-cream-300 rounded" />
                    )}
                    {block.type === "YOUTUBE" && (
                      <div className="h-5 bg-red-100 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-400 rounded-sm" />
                      </div>
                    )}
                    {block.type === "QUOTE" && (
                      <div className="border-l-2 border-gold/50 pl-1">
                        <div className="h-1 bg-ink/10 rounded w-4/5" />
                      </div>
                    )}
                    {block.type === "DIVIDER" && (
                      <div className="border-t border-border/60 my-0.5" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Active indicator */}
            {isActive && (
              <div className="absolute inset-0 ring-1 ring-forest/30 rounded" />
            )}
          </div>

          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] text-ink-muted font-medium">
              Page {page.pageNumber}
            </span>
            <span className="text-[10px] text-ink-faint">
              {page.blocks.length} block{page.blocks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onDuplicate}
            className="p-1 text-ink-faint hover:text-ink rounded hover:bg-cream-300 transition-colors"
            title="Duplicate page"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-ink-faint hover:text-red-500 rounded hover:bg-red-50 transition-colors"
            title="Delete page"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function PageSidebar({
  book,
  activePageId,
  onSelectPage,
  onAddPage,
  onPagesChange,
}: PageSidebarProps) {
  const [adding, setAdding] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const pages = [...book.pages]
    const oldIndex = pages.findIndex((p) => p.id === active.id)
    const newIndex = pages.findIndex((p) => p.id === over.id)

    const reordered = [...pages]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    const renumbered = reordered.map((p, i) => ({
      ...p,
      pageNumber: i + 1,
    }))

    onPagesChange(renumbered)
    const result = await reorderPages(
      book.id,
      renumbered.map((p) => p.id)
    )
    if (!result.success) toast.error("Failed to reorder pages")
  }

  async function handleDelete(pageId: string) {
    if (book.pages.length === 1) {
      toast.error("A book must have at least one page")
      return
    }

    const pageToDelete = book.pages.find((p) => p.id === pageId)!
    const newPages = book.pages
      .filter((p) => p.id !== pageId)
      .map((p) => ({
        ...p,
        pageNumber:
          p.pageNumber > pageToDelete.pageNumber
            ? p.pageNumber - 1
            : p.pageNumber,
      }))
    onPagesChange(newPages)

    // Select neighbor
    if (activePageId === pageId) {
      const neighbor = newPages.find(
        (p) => p.pageNumber === pageToDelete.pageNumber - 1
      ) ?? newPages[0]
      if (neighbor) onSelectPage(neighbor.id)
    }

    const result = await deletePage(pageId)
    if (!result.success) toast.error(result.error)
  }

  async function handleDuplicate(pageId: string) {
    const result = await duplicatePage(pageId)
    if (result.success) {
      const newPage = result.data
      const original = book.pages.find((p) => p.id === pageId)!
      const newPages = book.pages
        .map((p) => ({
          ...p,
          pageNumber:
            p.pageNumber > original.pageNumber ? p.pageNumber + 1 : p.pageNumber,
        }))
        .concat({ ...newPage, pageNumber: original.pageNumber + 1 })
        .sort((a, b) => a.pageNumber - b.pageNumber)
      onPagesChange(newPages)
      onSelectPage(newPage.id)
      toast.success("Page duplicated")
    } else {
      toast.error(result.error)
    }
  }

  async function handleAdd() {
    setAdding(true)
    await onAddPage()
    setAdding(false)
  }

  return (
    <aside className="w-36 sm:w-44 border-r border-border/60 bg-cream flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/40">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
          Pages
        </p>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={book.pages.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {book.pages.map((page) => (
              <SortablePageItem
                key={page.id}
                page={page}
                isActive={activePageId === page.id}
                onSelect={() => onSelectPage(page.id)}
                onDelete={() => handleDelete(page.id)}
                onDuplicate={() => handleDuplicate(page.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add page button */}
      <div className="p-2 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAdd}
          loading={adding}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Page
        </Button>
      </div>
    </aside>
  )
}
