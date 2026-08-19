'use client'

import { Heart, CircleDot, ChevronRight } from 'lucide-react'
import { COLOR, SPACE, TYPE, RADIUS } from '@/lib/brand'

// Two-door welcome (docs/ACCOUNT_MODEL.md) — matches native. Fans/family and
// players both belong here; neither door is a dead end.
export function WelcomeChooser({ onFan, onPlayer }: { onFan: () => void; onPlayer: () => void }) {
  return (
    <div>
      <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.18em', color: COLOR.gold }}>
        BOWLKOLLEN
      </div>
      <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em', margin: `${SPACE[2]}px 0 0` }}>
        Välkommen
      </h1>
      <p style={{ fontSize: TYPE.body, color: COLOR.ink2, marginTop: SPACE[2], lineHeight: 1.5 }}>
        Hela din bowling på ett ställe — oavsett om du spelar eller hejar.
      </p>

      <div style={{ marginTop: SPACE[8], display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
        <Door
          icon={<Heart size={26} color={COLOR.gold} />}
          title="Jag följer bowling"
          body="Fan eller familj — följ lag och spelare och få deras matcher, resultat och stories i flödet."
          onClick={onFan}
        />
        <Door
          icon={<CircleDot size={26} color={COLOR.bg} />}
          title="Jag är spelare"
          body="Följ ditt lag och koppla din spelarprofil för din egen statistik, dagbok och laguppställning."
          onClick={onPlayer}
          accent
        />
      </div>
    </div>
  )
}

function Door({ icon, title, body, onClick, accent }: {
  icon: React.ReactNode; title: string; body: string; onClick: () => void; accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: SPACE[4], width: '100%', textAlign: 'left',
        background: COLOR.surface, border: `1px solid ${accent ? 'rgba(245,194,0,0.35)' : COLOR.hairline}`,
        borderRadius: RADIUS.xl, padding: SPACE[4], cursor: 'pointer', color: COLOR.ink,
      }}
    >
      <span style={{
        width: 52, height: 52, borderRadius: RADIUS.lg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: accent ? COLOR.gold : 'rgba(245,194,0,0.10)',
      }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: TYPE.body + 2, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</span>
        <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 3, lineHeight: 1.4 }}>{body}</span>
      </span>
      <ChevronRight size={20} color={COLOR.ink3} style={{ flexShrink: 0 }} />
    </button>
  )
}
