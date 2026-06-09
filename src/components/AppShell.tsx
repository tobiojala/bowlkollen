'use client'
import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'
import NavTitle from '@/components/NavTitle'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import AuthRedirect from '@/components/AuthRedirect'
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/landing') return <>{children}</>
  return (<><AuthRedirect /><Nav /><div className="main-content" style={{ paddingBottom: 102 }}><NavTitle />{children}<Footer /></div><BottomNav /></>)
}
