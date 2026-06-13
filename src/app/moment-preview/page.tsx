'use client'

// TEMPORARY preview route for the MomentHero design — safe to delete.
import { useEffect, useState } from 'react'
import { dark } from '@/lib/colors'
import { MOCK_LIVE, MOCK_UPCOMING, MOCK_RECENT, MOCK_HONOR, MOCK_TABLES } from '../home/demoData'
import { buildMoments } from '../home/moments'
import MomentHero from '@/components/home/MomentHero'

export default function MomentPreview() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  // Pretend the user follows IK Hakarpspojkarna + Göteborgs BK.
  const followedIds = new Set(['demo-t1', 'demo-t3'])

  const moments = buildMoments({
    live: MOCK_LIVE,
    upcoming: MOCK_UPCOMING,
    recent: MOCK_RECENT,
    honor: MOCK_HONOR,
    tables: MOCK_TABLES,
    followedIds,
    now,
  })

  return (
    <main style={{ minHeight: '100vh', background: dark.bg, color: dark.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 8 }}>
        <div style={{ padding: '16px 16px 0', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: dark.textMuted }}>
          MOMENT HERO — PREVIEW
        </div>
        <MomentHero moments={moments} C={dark} isDark now={now} />

        {/* show every moment stacked so the full range is visible at once */}
        <div style={{ padding: '24px 16px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: dark.textMuted }}>
          ALLA STORIES ({moments.length})
        </div>
        {moments.map(m => (
          <MomentHero key={m.id} moments={[m]} C={dark} isDark now={now} />
        ))}
      </div>
    </main>
  )
}
