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

  // Wide surfaces keep the nav but manage their own (desktop) width instead of
  // the 600px app column. A route is added here only once its page carries a
  // responsive desktop layout of its own.
  const WIDE = ['/', '/schema', '/discover', '/divisioner', '/tavlingar', '/profile']
  const wide = WIDE.includes(pathname) || pathname.startsWith('/lag/') || pathname.startsWith('/divisioner/')
    || pathname.startsWith('/clubs/') || pathname.startsWith('/matcher/') || pathname.startsWith('/tavlingar/')

  return (
    <>
      <AuthRedirect />
      <WebNav />
      {/* Offset the fixed 64px top bar. */}
      <div style={{ maxWidth: wide ? '100%' : 600, margin: '0 auto' }}>
        <div className="main-content" style={{ paddingTop: 64, paddingBottom: 48 }}>{children}<Footer /></div>
      </div>
    </>
  )
}
