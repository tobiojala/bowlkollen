'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useColors } from '@/components/ThemeProvider'

const HIDE_PATHS = [
  '/intern', '/laguttagning', '/admin',
  '/matches/', '/players/', '/teams/', '/compare/', '/hallar/', '/klotshopar/',
]

const YEAR = new Date().getFullYear()

export default function Footer() {
  const pathname = usePathname()
  const { C } = useColors()

  if (HIDE_PATHS.some(p => pathname.includes(p))) return null

  return (
    <footer style={{ padding: '20px 20px 8px', textAlign: 'center',
      borderTop: '1px solid ' + C.border }}>
      <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
        © {YEAR} Tobias Ek-Ojala · Bowlkollen™
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.textMuted }}>
        Alla rättigheter förbehålls ·{' '}
        <Link href="/legal" style={{ color: C.textMuted, textDecoration: 'underline',
          textDecorationColor: C.border }}>
          Legal
        </Link>
      </p>
    </footer>
  )
}
