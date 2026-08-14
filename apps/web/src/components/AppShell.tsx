'use client'
import { usePathname } from 'next/navigation'
import WebNav from '@/components/WebNav'
import Footer from '@/components/Footer'
import AuthRedirect from '@/components/AuthRedirect'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Standalone surfaces — no app chrome / column. Landing + the shareable public
  // pages (they carry their own header, built wide for desktop).
  if (pathname === '/landing' || pathname.startsWith('/players/')) return <>{children}</>

  return (
    <>
      <AuthRedirect />
      <WebNav />
      {/* Offset the fixed 64px top bar; content stays in the app column for now. */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="main-content" style={{ paddingTop: 64, paddingBottom: 48 }}>{children}<Footer /></div>
      </div>
    </>
  )
}
