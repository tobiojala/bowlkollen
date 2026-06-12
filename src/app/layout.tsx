import React from 'react'
import type { Metadata } from 'next'
import { Barlow_Condensed } from 'next/font/google'
import ThemeProvider from '@/components/ThemeProvider'
import AppShell from '@/components/AppShell'
import QueryProvider from '@/components/QueryProvider'
import './globals.css'

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = { title: 'Bowlkollen', description: 'Live bowlingsajt for svenska ligan' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={barlow.variable}>
      <body style={{ margin: 0, padding: 0 }}>
        <QueryProvider><ThemeProvider><AppShell>{children}</AppShell></ThemeProvider></QueryProvider>
      </body>
    </html>
  )
}
