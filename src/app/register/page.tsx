import { redirect } from "next/navigation"
import { Navbar } from "@/components/marketing/navbar"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { getCurrentUser } from "@/lib/auth"

export const runtime = "edge"

export const metadata = {
  title: "Create Account",
}

interface RegisterPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
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
          title="Create your account"
          description="Use a basic MVP account to save your flipbooks, return to the editor later, and control when each book becomes public."
          form={<RegisterForm nextPath={nextPath} />}
          alternateText="Already have an account?"
          alternateLabel="Sign in"
          alternateHref={`/login?next=${encodeURIComponent(nextPath)}`}
        />
      </main>
    </div>
  )
}
