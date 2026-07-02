import Link from 'next/link'
import { createPublicSupabase } from '@/lib/supabase-server'
import { groupDivisionsByTier, TIER_COLOR } from '@/lib/division-standings'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { SEASON } from '@/lib/constants'

export const revalidate = 3600

function tierBadgeStyle(tierColor: string): React.CSSProperties {
  return {
    display: 'inline-block',
    fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em',
    color: tierColor,
    background: `${tierColor}18`,
    border: `1px solid ${tierColor}44`,
    borderRadius: RADIUS.sm,
    padding: '2px 7px',
    whiteSpace: 'nowrap' as const,
    fontFamily: FONT.body,
  }
}

export default async function DivisionerPage() {
  const supabase = createPublicSupabase()
  const { data: rawDivs } = await supabase
    .from('bits_divisions')
    .select('bits_division_id, name')
    .eq('season_id', Number(SEASON.CURRENT.slice(0, 4)))
    .order('name')

  const divs = rawDivs ?? []
  const groups = groupDivisionsByTier(divs)
  const isEmpty = divs.length === 0

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px 80px` }}>

        {/* Header */}
        <div style={{ marginBottom: SPACE[8] }}>
          <div style={{ fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: SPACE[2] }}>
            SERIESPEL {SEASON.CURRENT.slice(0, 4)}
          </div>
          <h1 style={{ fontFamily: FONT.body, fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', color: COLOR.ink, margin: 0 }}>
            Alla divisioner
          </h1>
          <p style={{ fontSize: TYPE.body, color: COLOR.ink3, margin: `${SPACE[3]}px 0 0` }}>
            {divs.length > 0
              ? `${divs.length} divisioner i Sverige`
              : 'Synca divisioner från admin → BITS för att se data'}
          </p>
        </div>

        {isEmpty && (
          <div style={{
            background: COLOR.surface, border: `1px solid ${COLOR.hairline}`,
            borderRadius: RADIUS.lg, padding: `${SPACE[8]}px ${SPACE[4]}px`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: SPACE[4] }}>🎳</div>
            <div style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.ink, marginBottom: SPACE[2] }}>
              Ingen data än
            </div>
            <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, lineHeight: 1.5 }}>
              Gå till{' '}
              <Link href="/admin/bits" style={{ color: COLOR.gold, textDecoration: 'none' }}>
                /admin/bits
              </Link>{' '}
              och kör steg 1 (synca divisioner) för säsong {SEASON.CURRENT.slice(0, 4)}.
            </div>
          </div>
        )}

        {/* Division groups */}
        {[...groups.entries()].map(([tier, tierDivs]) => {
          const tc = TIER_COLOR[tier] ?? COLOR.ink3
          return (
            <section key={tier} style={{ marginBottom: SPACE[8] }}>
              {/* Tier heading */}
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], marginBottom: SPACE[4] }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: tc, flexShrink: 0 }} />
                <span style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', color: tc, fontFamily: FONT.body }}>
                  {tier.toUpperCase()}
                </span>
                <span style={{ fontSize: TYPE.micro, color: COLOR.ink4 }}>{tierDivs.length}</span>
              </div>

              {/* Division rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tierDivs.map((div, i) => (
                  <Link
                    key={div.bits_division_id}
                    href={`/divisioner/${div.bits_division_id}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: `${SPACE[4]}px 0`,
                      borderBottom: `1px solid ${COLOR.hairline}`,
                      borderTop: i === 0 ? `1px solid ${COLOR.hairline}` : 'none',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], flex: 1, minWidth: 0 }}>
                      <span style={tierBadgeStyle(tc)}>
                        {tier.slice(0, 4).toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink,
                        fontFamily: FONT.body,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {div.name}
                      </span>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={COLOR.ink4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, marginLeft: SPACE[2] }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
