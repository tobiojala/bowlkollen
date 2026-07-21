'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { theme as resolveColors } from '@/lib/theme'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
})

export function useTheme() { return useContext(ThemeContext) }

/** One-line color access: `const { C, isDark } = useColors()` */
export function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return { C: resolveColors(isDark), isDark }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial value matches the blocking script default ('dark').
  // useEffect syncs with whatever the script already set on <html>.
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = (document.documentElement.dataset.theme as Theme) || 'dark'
    setTheme(stored)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('bk-theme', next) } catch {}
  }

  // No wrapper div — theme is applied via data-theme on <html> (set by the
  // blocking script in layout). This component is a pure context provider
  // with zero DOM footprint, making it compatible with cacheComponents.
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
