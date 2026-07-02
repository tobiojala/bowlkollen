'use client'
import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import AuthRedirect from '@/components/AuthRedirect'
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/landing') return <>{children}</>
  return (
    <>
      <AuthRedirect />
      <Nav />
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="main-content" style={{ paddingBottom: 102 }}>{children}<Footer /></div>
      </div>
      <BottomNav />
    </>
  )
}
