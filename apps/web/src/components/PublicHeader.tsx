'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession } from '@/lib/queries'
import WebNav from '@/components/WebNav'

// Header for the standalone public pages (player / team / division).
// Logged-in visitors get the full app nav so they never lose navigation while
// browsing; logged-out outside visitors get a clean minimal share header
// (just the wordmark + a login CTA) suited to a link shared out of the app.
export default function PublicHeader() {
  const { data: session } = useSession()

  if (session?.user) {
    // WebNav is fixed — reserve its height so page content clears it.
    return (
      <>
        <WebNav />
        <div style={{ height: 64 }} />
      </>
    )
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1160,
        margin: '0 auto',
        padding: '18px 24px',
      }}
    >
      <Link href="/" aria-label="Bowlkollen — hem" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <Image src="/bowlkollen-logotype.png" alt="Bowlkollen" width={150} height={50} priority style={{ height: 30, width: 'auto' }} />
      </Link>
      <Link
        href="/login"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'rgba(244,245,247,0.72)',
          textDecoration: 'none',
          padding: '8px 16px',
          borderRadius: 999,
          border: '1px solid rgba(244,245,247,0.14)',
        }}
      >
        Logga in
      </Link>
    </header>
  )
}
