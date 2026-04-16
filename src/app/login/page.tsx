import { redirect } from "next/navigation"
import { Navbar } from "@/components/marketing/navbar"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { getCurrentUser } from "@/lib/auth"

export const runtime = "edge"

export const metadata = {
  title: "Login",
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const currentUser = await getCurrentUser()
  const params = await searchParams
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/dashboard"

  if (currentUser) {
    redirect(nextPath)
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <AuthShell
          title="Welcome back"
          description="Sign in to manage your flipbooks, publish them when ready, and keep drafts private until they go live."
          form={<LoginForm nextPath={nextPath} />}
          alternateText="Need an account?"
          alternateLabel="Create one"
          alternateHref={`/register?next=${encodeURIComponent(nextPath)}`}
        />
      </main>
    </div>
  )
}
