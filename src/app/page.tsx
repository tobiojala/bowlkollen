'use client'

import React from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import WidgetGrid from '@/components/widgets/WidgetGrid'

export default function Home() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <WidgetGrid isDark={isDark} C={C} />
      </div>
    </main>
  )
}
