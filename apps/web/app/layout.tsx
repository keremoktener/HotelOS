import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { TRPCProvider } from '@/lib/trpc/provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HotelOS',
  description: 'Hotel Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="tr" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider>
            <TRPCProvider>{children}</TRPCProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
