'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const title = TITLES[pathname]
  if (!title) return null

  return (
    <div className="mobile-page-title" style={{ padding: '4px 20px 0' }}>
      <h1 style={{
        margin: 0,
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: -0.5,
        color: isDark ? '#ffffff' : '#1a2535',
      }}>
        {title}
      </h1>
    </div>
  )
}
