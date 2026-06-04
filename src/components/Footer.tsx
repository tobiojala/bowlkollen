'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HIDE_PATHS = [
  '/intern', '/laguttagning', '/admin',
  '/matches/', '/players/', '/teams/', '/compare/', '/hallar/', '/klotshopar/',
]

const YEAR = new Date().getFullYear()

export default function Footer() {
  const pathname = usePathname()

  if (HIDE_PATHS.some(p => pathname.includes(p))) return null

  return (
    <footer className="border-t border-light-border px-5 pt-5 pb-2 text-center dark:border-dark-border">
      <p className="m-0 text-[11px] leading-relaxed text-dark-muted">
        © {YEAR} Tobias Ek-Ojala · Bowlkollen™
      </p>
      <p className="mt-0.5 text-[10px] text-dark-muted">
        Alla rättigheter förbehålls ·{' '}
        <Link
          href="/legal"
          className="text-dark-muted underline decoration-light-border dark:decoration-dark-border"
        >
          Legal
        </Link>
      </p>
    </footer>
  )
}
