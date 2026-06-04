'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

type Theme = 'dark' | 'light'
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

export function useTheme() { return useContext(ThemeContext) }

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('bk-theme') as Theme
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('bk-theme', next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div
        data-theme={theme}
        className={cn(
          'min-h-screen bg-light-bg font-sans text-[#1a2535] transition-colors duration-200',
          'dark:bg-dark-bg dark:text-white',
        )}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
