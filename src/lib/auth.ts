import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { backendFetch, BackendApiError } from "@/lib/backend-api"
import { SESSION_COOKIE_NAME, SESSION_HEADER_NAME } from "@/lib/auth-constants"
import type { User } from "@/types"

export async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

export async function setSessionToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export async function clearSessionToken() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function backendFetchWithSession<T>(
  pathname: string,
  init?: RequestInit
): Promise<T> {
  const token = await getSessionToken()
  const headers = new Headers(init?.headers)

  if (token) {
    headers.set(SESSION_HEADER_NAME, token)
  }

  return backendFetch<T>(pathname, {
    ...init,
    headers,
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken()
  if (!token) {
    return null
  }

  try {
    return await backendFetchWithSession<User>("/auth/me")
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      return null
    }

    throw error
  }
}

export async function requireCurrentUser(nextPath = "/dashboard"): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    const next = encodeURIComponent(nextPath)
    redirect(`/login?next=${next}`)
  }

  return user
}
