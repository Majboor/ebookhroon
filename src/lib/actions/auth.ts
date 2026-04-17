"use server"

import { z } from "zod"
import { backendFetch } from "@/lib/backend-api"
import { backendFetchWithSession, clearSessionToken, getSessionToken, setSessionToken } from "@/lib/auth"
import { SESSION_HEADER_NAME } from "@/lib/auth-constants"
import type { ActionResult, User } from "@/types"

const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(40),
  email: z.string().email("Enter a valid email address").max(120),
  password: z.string().min(3, "Password must be at least 3 characters").max(120),
})

const LoginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Password is required"),
})

type AuthResponse = {
  token: string
  user: User
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed"
}

export async function registerUser(formData: FormData): Promise<ActionResult<User>> {
  const raw = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const parsed = RegisterSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    const response = await backendFetch<AuthResponse>("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })

    await setSessionToken(response.token)
    return { success: true, data: response.user }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function loginUser(formData: FormData): Promise<ActionResult<User>> {
  const raw = {
    identifier: formData.get("identifier") as string,
    password: formData.get("password") as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    const response = await backendFetch<AuthResponse>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })

    await setSessionToken(response.token)
    return { success: true, data: response.user }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function logoutUser(): Promise<ActionResult> {
  const token = await getSessionToken()

  try {
    if (token) {
      await backendFetchWithSession<{ loggedOut: boolean }>("/auth/logout", {
        method: "POST",
        headers: {
          [SESSION_HEADER_NAME]: token,
        },
      })
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  } finally {
    await clearSessionToken()
  }

  return { success: true, data: undefined }
}
