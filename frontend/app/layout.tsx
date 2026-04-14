import '@fontsource/instrument-serif'
import '@fontsource/jetbrains-mono'
import '@fontsource/instrument-sans'
import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'MailAPT',
  description: 'Generate and summarize emails with AI. Compose professional emails faster and understand email content instantly.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}