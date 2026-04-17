"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { registerUser } from "@/lib/actions/auth"

interface RegisterFormProps {
  nextPath: string
}

export function RegisterForm({ nextPath }: RegisterFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await registerUser(formData)
      if (!result.success) {
        setErrors({ form: result.error })
        toast.error(result.error)
        return
      }

      toast.success(`Account created for ${result.data.username}`)
      router.push(nextPath)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="username"
        label="Username"
        placeholder="storybookmaker"
        autoComplete="username"
        required
      />
      <Input
        name="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Input
        name="password"
        label="Password"
        type="password"
        placeholder="Create a password"
        autoComplete="new-password"
        required
      />

      {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}

      <Button type="submit" className="w-full" size="lg" loading={isPending}>
        Create Account
      </Button>
    </form>
  )
}
