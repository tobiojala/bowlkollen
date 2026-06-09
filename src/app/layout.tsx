import React from 'react'
import type { Metadata } from 'next'
import ThemeProvider from '@/components/ThemeProvider'
import AppShell from '@/components/AppShell'
import QueryProvider from '@/components/QueryProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bowlkollen',
  description: 'Live bowlingsajt for svenska ligan',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body style={{ margin: 0, padding: 0 }}>
        <QueryProvider>
          <ThemeProvider>
            <AppShell>
              {children}
            </AppShell>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
