export class BackendApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = "BackendApiError"
    this.status = status
  }
}

export function getBackendBaseUrl() {
  const baseUrl =
    process.env.FASTAPI_BASE_URL ?? process.env.NEXT_PUBLIC_FASTAPI_BASE_URL

  if (!baseUrl) {
    throw new BackendApiError(
      "Missing backend URL. Set FASTAPI_BASE_URL or NEXT_PUBLIC_FASTAPI_BASE_URL."
    )
  }

  return baseUrl
}

export function buildBackendUrl(pathname: string) {
  return `${getBackendBaseUrl()}${pathname}`
}

export async function backendFetch<T>(
  pathname: string,
  init?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(buildBackendUrl(pathname), {
      cache: "no-store",
      ...init,
    })

    if (!response.ok) {
      let message = `Backend request failed (${response.status})`

      try {
        const payload = await response.json()
        if (typeof payload?.detail === "string") {
          message = payload.detail
        } else if (typeof payload?.error === "string") {
          message = payload.error
        }
      } catch {
        // Keep the fallback message when the backend does not return JSON.
      }

      throw new BackendApiError(message, response.status)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw error
    }

    throw new BackendApiError(
      `Could not reach FastAPI backend at ${getBackendBaseUrl()}`
    )
  }
}
