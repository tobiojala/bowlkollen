'use client'

import { useState } from 'react'
import { COLOR, FONT } from '@/lib/brand'
import { LogGame } from './LogGame'
import { SparAnalys } from './SparAnalys'

// Mina spel hub: two views over the same loop — Logga spel (score a game via the
// pin deck, capturing leaves) and Spärranalys (built from what you log). The
// analysis view lands in phase 4; for now it points you at logging.
export function MinaSpelClient() {
  const [tab, setTab] = useState<'log' | 'analys'>('log')
  const on = (t: 'log' | 'analys') => ({
    border: 'none', cursor: 'pointer', fontFamily: FONT.body, fontWeight: 700, fontSize: 14,
    padding: '9px 18px', borderRadius: 999,
    background: tab === t ? COLOR.surface2 : 'transparent', color: tab === t ? COLOR.ink : COLOR.ink3,
  })
  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 120px' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 12, color: COLOR.gold }}>Bowlkollen</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', margin: '6px 0 16px' }}>Mina spel</h1>

        <div style={{ display: 'flex', gap: 4, background: COLOR.surface, borderRadius: 999, padding: 4, width: 'fit-content', marginBottom: 26 }}>
          <button style={on('log')} onClick={() => setTab('log')}>Logga spel</button>
          <button style={on('analys')} onClick={() => setTab('analys')}>Spärranalys</button>
        </div>

        {tab === 'log' ? <LogGame onSaved={() => setTab('analys')} /> : <SparAnalys />}
      </div>
    </main>
  )
}
