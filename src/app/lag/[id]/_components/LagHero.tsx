'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
import { COLOR, FONT, SPACE } from '@/lib/brand'
import { teamColor, teamInitials } from '@/lib/utils'
import { divisionTier, TIER_COLOR, type MatchRow, type TeamStanding } from '@/lib/division-standings'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { LagActions } from './LagActions'
import { LagStatRow } from './LagStatRow'
import { TeamStoryBanner } from './TeamStoryBanner'

type Standing      = { rank: number; total: number; points: number; played: number }
type SeasonSummary = { seasonLabel: string; divisionId: number; divisionName: string | null; standing: Standing; standings: TeamStanding[] }

type Props = {
  teamId:       number
  teamName:     string
  clubId:       number | null
  divisionId:   number
  divisionName: string | null
  hallId:       number | null
  hallName:     string | null
  matches:      MatchRow[]
  standing:     Standing | null
  standings:    TeamStanding[]
  prevSeason:   SeasonSummary | null
}

/** The team's shareable front door — identity, standing, form, venue, and the
 * follow/claim/export actions. No team logos exist in BITS data, so identity
 * is typographic: an ambient glow + gradient ring keyed off the team name
 * (teamColor), the same hash used everywhere else the team appears. */
export function LagHero({ teamId, teamName, clubId, divisionId, divisionName, hallId, hallName, matches, standing, standings, prevSeason }: Props) {
  const tier      = divisionName ? divisionTier(divisionName) : ''
  const tierColor = TIER_COLOR[tier] ?? COLOR.gold
  const tc        = teamColor(teamName, true)
  const initials  = teamInitials(teamName)

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

  // Before this season has a finished match, fall back to last season's table.
  const activeStanding = standing ?? prevSeason?.standing ?? null
  const isHistorical   = !standing && !!prevSeason

  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="visible"
      style={{ position: 'relative', padding: `${SPACE[6]}px ${SPACE[4]}px ${SPACE[2]}px`, overflow: 'hidden' }}
    >
      {/* Ambient glow — this team's identity colour, softly lighting the hero
          instead of a flat background. No logo asset needed. */}
      <div style={{
        position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)',
        width: 360, height: 240, borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(circle, ${tc.border}30 0%, transparent 70%)`,
        filter: 'blur(30px)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <motion.div variants={staggerItem}>
          <Link href={`/divisioner/${divisionId}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4],
          }}>
            <ChevronLeft size={15} /> {divisionName ?? 'Divisionen'}
          </Link>
        </motion.div>

        {/* Identity — gradient "story ring" around the initials, the one
            recognisable signature every social profile shares. */}
        <motion.div variants={staggerItem} style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', flexShrink: 0, padding: 3,
            background: `conic-gradient(${tc.border}, ${tc.text}, ${tc.border})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%', border: `2px solid ${COLOR.bg}`,
              background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: 700, color: tc.text, letterSpacing: '-0.01em' }}>
                {initials}
              </span>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            {divisionName && (
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: tierColor, marginBottom: 2 }}>
                {tier.toUpperCase()}
              </div>
            )}
            <h1 style={{
              fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: COLOR.ink, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {teamName}
            </h1>
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          {isHistorical && prevSeason && (
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginTop: SPACE[6] }}>
              FÖRRA SÄSONGEN {prevSeason.seasonLabel}
            </div>
          )}
          {activeStanding ? (
            <LagStatRow standing={activeStanding} form={form} historical={isHistorical} />
          ) : (
            <div style={{ marginTop: SPACE[6], fontSize: 14, color: COLOR.ink2 }}>{matches.length} matcher inlagda</div>
          )}
        </motion.div>

        <motion.div variants={staggerItem}>
          <TeamStoryBanner teamId={teamId} matches={matches} standings={standings} />
        </motion.div>

        {hallName && (
          <motion.div variants={staggerItem} style={{ marginTop: SPACE[3] }}>
            {hallId != null ? (
              <Link href={`/hallar/${hallId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLOR.ink2, textDecoration: 'none' }}>
                <MapPin size={13} color={COLOR.ink3} /> {hallName}
              </Link>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLOR.ink2 }}>
                <MapPin size={13} color={COLOR.ink3} /> {hallName}
              </span>
            )}
          </motion.div>
        )}

        <motion.div variants={staggerItem} style={{ marginTop: SPACE[4] }}>
          <LagActions teamId={teamId} teamName={teamName} clubId={clubId} matches={matches} />
        </motion.div>
      </div>
    </motion.div>
  )
}
