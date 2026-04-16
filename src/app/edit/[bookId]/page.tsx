import { notFound } from "next/navigation"
import { getBookWithPages } from "@/lib/actions/books"
import { BookEditor } from "@/components/editor/book-editor"

interface EditPageProps {
  params: Promise<{ bookId: string }>
}

export async function generateMetadata({ params }: EditPageProps) {
  const { bookId } = await params
  const book = await getBookWithPages(bookId)
  if (!book) return { title: "Book Not Found" }
  return { title: `Editing: ${book.title}` }
}

export default async function EditPage({ params }: EditPageProps) {
  const { bookId } = await params
  const book = await getBookWithPages(bookId)

  if (!book) notFound()

  return <BookEditor initialBook={book} />
}
