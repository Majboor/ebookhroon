import { Navbar } from "@/components/marketing/navbar"
import { CreateBookForm } from "@/components/create/create-book-form"

export const metadata = {
  title: "Create a Book",
}

export default function CreatePage() {
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
              Fill in the basics to get started. You can change everything later in the editor.
            </p>
          </div>
          <div className="bg-paper rounded-2xl border border-border shadow-card p-8">
            <CreateBookForm />
          </div>
        </div>
      </main>
    </div>
  )
}
