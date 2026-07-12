'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Heart, ShieldCheck, Clock } from 'lucide-react'
import { useSession, useIsFollowing, useToggleFollow, useTeamClaim } from '@/lib/queries'
import { COLOR, FONT, SPACE } from '@/lib/brand'
import { divisionTier, TIER_COLOR, type MatchRow } from '@/lib/division-standings'
import { DivisionMatches } from '@/app/divisioner/[id]/_components/DivisionMatches'
import { ClaimTeamSheet } from './ClaimTeamSheet'
import { RolePicker } from './RolePicker'

type Standing   = { rank: number; total: number; points: number; played: number }
type RosterRow  = { public_id: string; name: string; licence_average: number | null; appearances: number }

type Props = {
  teamId:       number
  teamName:     string
  clubId:       number | null
  divisionId:   number
  divisionName: string | null
  matches:      MatchRow[]
  standing:     Standing | null
  roster:       RosterRow[]
}

const ghost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 2px', background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 14, fontWeight: 600, color: COLOR.ink2, textDecoration: 'none',
  WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
}

export function LagClient({ teamId, teamName, clubId, divisionId, divisionName, matches, standing, roster }: Props) {
  const { data: session }                   = useSession()
  const isFollowing                         = useIsFollowing('team', String(teamId))
  const { mutate: toggleFollow, isPending } = useToggleFollow('team', String(teamId))
  const { data: claim }                     = useTeamClaim(teamId)
  const [claimOpen, setClaimOpen]           = useState(false)

  const tier      = divisionName ? divisionTier(divisionName) : ''
  const tierColor = TIER_COLOR[tier] ?? COLOR.gold

  // Form — last 5 played, from this team's perspective. Never routes to a club.
  const form = matches
    .filter(m => m.is_finished && m.home_result != null && m.away_result != null)
    .slice(-5)
    .map(m => {
      const home = m.home_bits_team_id === teamId
      const my   = home ? m.home_result! : m.away_result!
      const opp  = home ? m.away_result! : m.home_result!
      return my > opp ? 'W' : my < opp ? 'L' : 'D'
    })

  const teamHref = (bitsId: number) => bitsId === teamId ? `/lag/${teamId}` : `/lag/${bitsId}`

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 96 }}>

        {/* Header */}
        <div style={{ padding: `${SPACE[6]}px ${SPACE[4]}px ${SPACE[2]}px` }}>
          <Link href={`/divisioner/${divisionId}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4],
          }}>
            <ChevronLeft size={15} /> {divisionName ?? 'Divisionen'}
          </Link>

          {divisionName && (
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: tierColor, marginBottom: SPACE[1] }}>
              {tier.toUpperCase()} · {divisionName}
            </div>
          )}
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: COLOR.ink, margin: 0 }}>
            {teamName}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[2], flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: COLOR.ink2 }}>
              {standing
                ? `Plats ${standing.rank} av ${standing.total} · ${standing.points} poäng`
                : `${matches.length} matcher`}
            </span>
            {form.length > 0 && (
              <span style={{ display: 'inline-flex', gap: 3 }}>
                {form.map((r, i) => (
                  <span key={i} style={{
                    width: 18, height: 18, borderRadius: 5,
                    fontSize: 11, fontWeight: 800, color: '#0b0d10',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: r === 'W' ? COLOR.green : r === 'L' ? COLOR.red : COLOR.ink3,
                  }}>
                    {r === 'W' ? 'V' : r === 'L' ? 'F' : 'O'}
                  </span>
                ))}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[6], marginTop: SPACE[4], flexWrap: 'wrap' }}>
            {session && (
              <button onClick={() => toggleFollow()} disabled={isPending}
                style={{ ...ghost, color: isFollowing ? COLOR.gold : COLOR.ink2 }}>
                <Heart size={16} strokeWidth={2} color={isFollowing ? COLOR.gold : COLOR.ink2} fill={isFollowing ? COLOR.gold : 'none'} />
                {isFollowing ? 'Följer' : 'Följ'}
              </button>
            )}

            {/* Claim your spot — membership, then a private self-chosen role.
                'Kapten' is what will unlock lineup/admin tools. */}
            {session && claim?.status === 'verified' && (
              <RolePicker bitsTeamId={teamId} role={claim.role} />
            )}
            {session && claim?.status === 'pending' && (
              <span style={{ ...ghost, cursor: 'default' }}>
                <Clock size={16} strokeWidth={2} color={COLOR.ink2} /> Väntar på granskning
              </span>
            )}
            {session && (claim == null || claim.status === 'rejected') && (
              <button onClick={() => setClaimOpen(true)} style={ghost}>
                <ShieldCheck size={16} strokeWidth={2} color={COLOR.ink2} /> Spelar du här?
              </button>
            )}

            {clubId != null && <Link href={`/clubs/${clubId}`} style={ghost}>Till klubben →</Link>}
          </div>
        </div>

        {/* Trupp — the roster, each player a doorway into their profile */}
        {roster.length > 0 && (
          <section style={{ marginTop: SPACE[4] }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2, padding: '0 20px 10px' }}>
              TRUPP
            </div>
            {roster.map(p => (
              <Link key={p.public_id} href={`/players/${p.public_id}`} style={{
                display: 'flex', alignItems: 'center', gap: SPACE[3],
                padding: '13px 20px', borderTop: `1px solid ${COLOR.hairline}`,
                textDecoration: 'none', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 13, color: COLOR.ink2, whiteSpace: 'nowrap' }}>
                  {p.licence_average ? `snitt ${p.licence_average} · ` : ''}{p.appearances} {p.appearances === 1 ? 'match' : 'matcher'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink3}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </section>
        )}

        {/* Their season */}
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2, padding: `${SPACE[6]}px 20px 4px` }}>
          MATCHER
        </div>
        <DivisionMatches matches={matches} teamHref={teamHref} />
      </div>

      <ClaimTeamSheet open={claimOpen} onClose={() => setClaimOpen(false)} teamId={teamId} teamName={teamName} />
    </main>
  )
}
