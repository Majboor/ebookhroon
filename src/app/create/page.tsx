import { Navbar } from "@/components/marketing/navbar"
import { CreateBookForm } from "@/components/create/create-book-form"
import { requireCurrentUser } from "@/lib/auth"

export const runtime = "edge"

export const metadata = {
  title: "Create a Book",
}

export default async function CreatePage() {
  const currentUser = await requireCurrentUser("/create")

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-forest mb-2">
              Create a new book
            </h1>
            <p className="text-ink-muted">
              You are signed in as <span className="font-medium text-ink">{currentUser.username}</span>. Fill in the basics now and edit the rest later in the ebook editor.
            </p>
          </div>
          <div className="bg-paper rounded-2xl border border-border shadow-card p-8">
            <CreateBookForm defaultAuthorName={currentUser.username} />
          </div>
        </div>
      </main>
    </div>
  )
}
