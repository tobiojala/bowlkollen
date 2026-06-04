import React from 'react'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import NavTitle from '@/components/NavTitle'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import ThemeProvider from '@/components/ThemeProvider'
import AuthRedirect from '@/components/AuthRedirect'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bowlkollen',
  description: 'Live bowlingsajt for svenska ligan',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className="m-0 p-0">
        <ThemeProvider>
          <AuthRedirect />
          <Nav />
          <div className="main-content pb-[102px]">
            <NavTitle />
            {children}
            <Footer />
          </div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
