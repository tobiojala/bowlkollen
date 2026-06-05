'use client'

import { usePathname } from 'next/navigation'

const TITLES: Record<string, string> = {
  '/schema':       'Schema',
  '/tavlingar':    'Tävlingar',
  '/teams':        'Lag',
  '/players':      'Spelare',
  '/profile':      'Min profil',
  '/hallar':       'Bowlinghallar',
  '/klotshopar':   'Klotshopar',
  '/oljeprofiler': 'Oljeprofiler',
  '/sllm':         'SLLM 2026',
  '/puls':         'Puls',
  '/mer':          'Utforska',
  '/league':       'Serietabell',
  '/login':        'Logga in',
  '/legal':        'Legal',
}

export default function NavTitle() {
  const pathname = usePathname()
  const title = TITLES[pathname]
  if (!title) return null

  return (
    <div className="mobile-page-title px-5 pt-1">
      <h1 className="m-0 text-[30px] font-extrabold tracking-tight bk-text-primary">
        {title}
      </h1>
    </div>
  )
}
