import React from 'react'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import ThemeProvider from '@/components/ThemeProvider'
import AuthRedirect from '@/components/AuthRedirect'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bowlkollen',
  description: 'Live bowlingsajt for svenska ligan',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeProvider>
          <AuthRedirect />
          <Nav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
