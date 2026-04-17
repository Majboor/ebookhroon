"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { loginUser } from "@/lib/actions/auth"

interface LoginFormProps {
  nextPath: string
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await loginUser(formData)
      if (!result.success) {
        setErrors({ form: result.error })
        toast.error(result.error)
        return
      }

      toast.success(`Welcome back, ${result.data.username}`)
      router.push(nextPath)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="identifier"
        label="Username or Email"
        placeholder="you@example.com"
        autoComplete="username"
        required
      />
      <Input
        name="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        required
      />

      {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}

      <Button type="submit" className="w-full" size="lg" loading={isPending}>
        Sign In
      </Button>
    </form>
  )
}
