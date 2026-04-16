import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Folio — Premium Digital Flipbooks",
    template: "%s | Folio",
  },
  description:
    "Create and share beautiful digital flipbooks. Add rich text, images, and videos to stunning page-flipping books.",
  keywords: ["flipbook", "ebook", "digital book", "publishing", "reading"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    siteName: "Folio",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#FFFDF9",
              border: "1px solid #D8CFC4",
              color: "#2C2C2C",
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </body>
    </html>
  )
}
