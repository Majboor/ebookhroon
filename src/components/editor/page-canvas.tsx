"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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
import { GripVertical, Trash2, Plus } from "lucide-react"
import { BlockMenu } from "./block-menu"
import { BlockRenderer } from "./block-renderer"
import { addBlock, updateBlock, deleteBlock, reorderBlocks } from "@/lib/actions/blocks"
import { cn } from "@/lib/utils"
import type { PageWithBlocks, Block, BlockType, BlockData } from "@/types"

interface PageCanvasProps {
  page: PageWithBlocks
  bookId: string
  onPageChange: (page: PageWithBlocks) => void
  onSavingChange: (saving: boolean) => void
}

// Autosave debounce (ms)
const AUTOSAVE_DELAY = 1500

interface SortableBlockProps {
  block: Block
  onUpdate: (data: BlockData) => Promise<void>
  onDelete: () => void
}

function SortableBlock({ block, onUpdate, onDelete }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "opacity-50 z-10"
      )}
    >
      {/* Block actions */}
      <div className="absolute -left-8 top-0 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 text-ink-faint hover:text-ink rounded cursor-grab active:cursor-grabbing hover:bg-cream-300"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          className="p-1 text-ink-faint hover:text-red-500 rounded hover:bg-red-50"
          onClick={onDelete}
          title="Delete block"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <BlockRenderer
        block={block}
        onUpdate={onUpdate}
        isEditing
      />
    </div>
  )
}

export function PageCanvas({
  page,
  bookId,
  onPageChange,
  onSavingChange,
}: PageCanvasProps) {
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Debounced update handler
  const scheduleAutosave = useCallback(
    (blockId: string, data: BlockData) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      onSavingChange(true)
      autosaveTimer.current = setTimeout(async () => {
        const result = await updateBlock(blockId, data)
        if (!result.success) {
          toast.error("Failed to save changes")
        }
        onSavingChange(false)
      }, AUTOSAVE_DELAY)
    },
    [onSavingChange]
  )

  function handleBlockUpdate(blockId: string) {
    return async (data: BlockData) => {
      // Optimistic local update
      const updatedBlocks = page.blocks.map((b) =>
        b.id === blockId ? { ...b, data } : b
      )
      onPageChange({ ...page, blocks: updatedBlocks })
      scheduleAutosave(blockId, data)
    }
  }

  async function handleAddBlock(type: BlockType, afterOrder?: number) {
    const result = await addBlock(page.id, type, afterOrder)
    if (result.success) {
      const newBlock = result.data
      const newBlocks = [...page.blocks]
      if (afterOrder !== undefined) {
        const shifted = newBlocks.map((b) => ({
          ...b,
          order: b.order > afterOrder ? b.order + 1 : b.order,
        }))
        shifted.push(newBlock)
        shifted.sort((a, b) => a.order - b.order)
        onPageChange({ ...page, blocks: shifted })
      } else {
        onPageChange({ ...page, blocks: [...newBlocks, newBlock] })
      }
    } else {
      toast.error(result.error)
    }
  }

  async function handleDeleteBlock(blockId: string) {
    const blockToDelete = page.blocks.find((b) => b.id === blockId)!
    const newBlocks = page.blocks
      .filter((b) => b.id !== blockId)
      .map((b) => ({
        ...b,
        order: b.order > blockToDelete.order ? b.order - 1 : b.order,
      }))
    onPageChange({ ...page, blocks: newBlocks })

    const result = await deleteBlock(blockId)
    if (!result.success) toast.error(result.error)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const blocks = [...page.blocks]
    const oldIdx = blocks.findIndex((b) => b.id === active.id)
    const newIdx = blocks.findIndex((b) => b.id === over.id)

    const reordered = [...blocks]
    const [moved] = reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, moved)

    const renumbered = reordered.map((b, i) => ({ ...b, order: i }))
    onPageChange({ ...page, blocks: renumbered })

    const result = await reorderBlocks(
      page.id,
      renumbered.map((b) => b.id)
    )
    if (!result.success) toast.error("Failed to reorder blocks")
  }

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-10">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3 text-ink-muted text-sm">
          <span className="font-serif font-medium">Page {page.pageNumber}</span>
          {page.title && (
            <>
              <span>·</span>
              <span className="text-ink-light">{page.title}</span>
            </>
          )}
        </div>
        <p className="text-xs text-ink-faint mt-1">
          Click any block to edit. Drag the handle to reorder.
        </p>
      </div>

      {/* Blocks */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={page.blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 pl-8">
            {page.blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onUpdate={handleBlockUpdate(block.id)}
                onDelete={() => handleDeleteBlock(block.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add block section */}
      <div className="mt-8 pl-8">
        <AddBlockSection
          onAdd={(type) =>
            handleAddBlock(type, page.blocks.length > 0 ? page.blocks.length - 1 : undefined)
          }
        />
      </div>
    </div>
  )
}

function AddBlockSection({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      {open ? (
        <BlockMenu
          onSelect={(type) => {
            onAdd(type)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink group transition-colors py-2"
        >
          <div className="h-6 w-6 rounded-full border border-dashed border-border group-hover:border-forest/40 group-hover:bg-forest/5 flex items-center justify-center transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </div>
          Add a block
        </button>
      )}
    </div>
  )
}
