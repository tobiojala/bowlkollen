'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import AuthRedirect from '@/components/AuthRedirect'

const COL = 'max(0px, calc(50vw - 300px))'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  // Fresh page starts with the top blur hidden until the user actually scrolls.
  useEffect(() => { setScrolled(false) }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    // Pages with a virtualised/internal scroll container dispatch this instead
    // of a real window scroll — see BottomNav for the other consumer.
    const onVirtualScroll = (e: Event) => setScrolled((e as CustomEvent<{ y: number }>).detail.y > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('bk-scroll', onVirtualScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('bk-scroll', onVirtualScroll)
    }
  }, [])

  if (pathname === '/landing') return <>{children}</>

  return (
    <>
      <AuthRedirect />
      <Nav />
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="main-content" style={{ paddingBottom: 102 }}>{children}<Footer /></div>
      </div>
      <BottomNav />

      {/* Top blur — fades in on scroll, frosts content passing under the fixed Nav */}
      <div style={{
        position: 'fixed', top: 0, left: COL, right: COL, height: 80,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
        background: 'linear-gradient(to bottom, rgba(14,17,22,0.6) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 8,
        opacity: scrolled ? 1 : 0, transition: 'opacity 0.25s ease',
      } as React.CSSProperties} />

      {/* Bottom blur — always visible, frosts content passing under BottomNav */}
      <div style={{
        position: 'fixed', bottom: 0, left: COL, right: COL, height: 100,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
        maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
        background: 'linear-gradient(to top, rgba(14,17,22,0.6) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 8,
      } as React.CSSProperties} />
    </>
  )
}
