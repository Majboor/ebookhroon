"use server"

import { backendFetchWithSession } from "@/lib/auth"
import type { Page, ActionResult, PageWithBlocks } from "@/types"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed"
}

export async function addPage(
  bookId: string,
  afterPageNumber?: number
): Promise<ActionResult<Page>> {
  try {
    const data = await backendFetchWithSession<Page>("/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, afterPageNumber }),
    })

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function duplicatePage(
  pageId: string
): Promise<ActionResult<PageWithBlocks>> {
  try {
    const data = await backendFetchWithSession<PageWithBlocks>(`/pages/${pageId}/duplicate`, {
      method: "POST",
    })

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function deletePage(pageId: string): Promise<ActionResult> {
  try {
    await backendFetchWithSession<{ bookId: string }>(`/pages/${pageId}`, {
      method: "DELETE",
    })

    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function reorderPages(
  bookId: string,
  orderedPageIds: string[]
): Promise<ActionResult> {
  try {
    await backendFetchWithSession<{ bookId: string }>("/pages/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, orderedPageIds }),
    })

    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updatePageTitle(
  pageId: string,
  title: string
): Promise<ActionResult<Page>> {
  try {
    const data = await backendFetchWithSession<Page>(`/pages/${pageId}/title`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })

    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
