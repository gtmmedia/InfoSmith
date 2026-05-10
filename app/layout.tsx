import { Geist, Geist_Mono, DM_Sans } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: {
    default: "InfoSmith — AI Document Assistant",
    template: "%s | InfoSmith",
  },
  description:
    "Upload your documents and chat with them using AI. InfoSmith provides context-grounded answers powered by RAG and vector embeddings.",
  keywords: [
    "InfoSmith",
    "RAG",
    "document chat",
    "AI assistant",
    "vector search",
    "LangChain",
    "Qdrant",
  ],
  authors: [{ name: "Akshat Sipany" }],
  openGraph: {
    title: "InfoSmith — AI Document Assistant",
    description:
      "Upload documents and get reliable, context-grounded answers with InfoSmith.",
    type: "website",
    locale: "en_US",
    siteName: "InfoSmith",
  },
  twitter: {
    card: "summary_large_image",
    title: "InfoSmith — AI Document Assistant",
    description:
      "Upload documents and get reliable, context-grounded answers with InfoSmith.",
  },
  icons: {
    icon: "/favicon.ico",
  },
}

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", dmSans.variable)}
    >
      <body>
        <ThemeProvider>
          <SidebarProvider style={
            {
              "--sidebar-width": "20rem",
              "--sidebar-width-mobile": "20rem",
            } as React.CSSProperties
          }>
            <AppSidebar />
            <SidebarInset>
              <Header />
              <div className="flex min-h-0 flex-1 flex-col">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
