'use client'

import FollowButton from '@/components/FollowButton'
import { useOnboardingSuggestions } from '@/lib/queries'
import { COLOR, SPACE, TYPE } from '@/lib/brand'
import type { PlayerSuggestionTier } from '@/lib/types'

const TIER_LABEL: Record<PlayerSuggestionTier, string> = {
  teammate:             'Dina lagkamrater',
  elitserien_regional:  'Elitserien i din region',
  division_rival:       'Rivaler i din division',
}

export default function SuggestionTiers({ bitsTeamId }: { bitsTeamId: number }) {
  const { data, isLoading } = useOnboardingSuggestions(bitsTeamId)

  if (isLoading) {
    return <div style={{ padding: SPACE[6], textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.caption }}>Letar efter förslag…</div>
  }
  if (!data || (data.teams.length === 0 && data.players.length === 0)) return null

  const tiers: PlayerSuggestionTier[] = ['teammate', 'elitserien_regional', 'division_rival']

  return (
    <div>
      {data.teams.length > 0 && (
        <Section label="Lag i närheten">
          {data.teams.map(t => (
            <Row key={t.bitsTeamId} title={t.name} subtitle={t.clubName} entityType="team" entityId={String(t.bitsTeamId)} />
          ))}
        </Section>
      )}

      {tiers.map(tier => {
        const players = data.players.filter(p => p.tier === tier)
        if (players.length === 0) return null
        return (
          <Section key={tier} label={TIER_LABEL[tier]}>
            {players.map(p => (
              <Row key={p.publicId} title={p.name} subtitle={p.licenceAverage ? `Snitt ${p.licenceAverage}` : null} entityType="player" entityId={p.publicId} />
            ))}
          </Section>
        )
      })}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: SPACE[6] }}>
      <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink2, padding: `0 ${SPACE[4]}px ${SPACE[2]}px` }}>
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

function Row({ title, subtitle, entityType, entityId }: {
  title: string
  subtitle?: string | null
  entityType: 'team' | 'player'
  entityId: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3],
      padding: `10px ${SPACE[4]}px`, borderBottom: `1px solid ${COLOR.hairline}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{subtitle}</div>}
      </div>
      <FollowButton entityType={entityType} entityId={entityId} variant="pill" size="sm" />
    </div>
  )
}
