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

  // Wide surfaces keep the nav but manage their own (desktop-dashboard) width,
  // instead of the 600px app column that everything else still uses.
  const wide = pathname === '/'

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
