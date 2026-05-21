import React from 'react'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import BottomNav from '@/components/BottomNav'
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
        <div style={{ paddingTop: 56, paddingBottom: 68 }}>
          {children}
        </div>
        <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
