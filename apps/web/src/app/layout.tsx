import React from 'react'
import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans, Sora } from 'next/font/google'
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

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

// Scores & stat numbers — mirrors native (Sora 600/700/800).
const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-score',
  display: 'swap',
})

export const metadata: Metadata = { title: 'Bowlkollen', description: 'Live bowlingsajt for svenska ligan' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${barlow.variable} ${dmSans.variable} ${sora.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <QueryProvider><ThemeProvider><AppShell>{children}</AppShell></ThemeProvider></QueryProvider>
      </body>
    </html>
  )
}
