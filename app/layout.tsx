import type React from "react"
import type { Metadata } from "next"
import { Arimo, Quicksand, Montserrat } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"

const quicksand = Quicksand({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-quicksand"
});

const arimo = Arimo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-arimo"
});

const montserrat = Montserrat({
  weight: "200",
  subsets: ["latin"],
  variable: "--font-montserrat"
});

export const metadata: Metadata = {
  title: {
    default: "Lokal - Yerel Aktiviteler ve Etkinlikler",
    template: "%s | Lokal",
  },
  description:
    "Yerel aktiviteler ve etkinlikler için buluşma noktanız. Kahve, atölye, oyun ve daha fazlası için katılın!",
  keywords: ["yerel etkinlikler", "aktiviteler", "topluluk", "buluşma", "kahve", "atölye", "oyun"],
  authors: [{ name: "Lokal Team" }],
  creator: "Lokal",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://lokal.com",
    title: "Lokal - Yerel Aktiviteler ve Etkinlikler",
    description: "Yerel aktiviteler ve etkinlikler için buluşma noktanız",
    siteName: "Lokal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lokal - Yerel Aktiviteler ve Etkinlikler",
    description: "Yerel aktiviteler ve etkinlikler için buluşma noktanız",
  },
  robots: {
    index: true,
    follow: true,
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={`${montserrat.variable} ${quicksand.variable} ${arimo.variable} font-montserrat`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
