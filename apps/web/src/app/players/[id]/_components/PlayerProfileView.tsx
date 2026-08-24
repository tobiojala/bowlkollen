'use client'

import { useState } from 'react'

import Reveal from '@/components/Reveal'
import FollowButton from '@/components/FollowButton'
import PublicHeader from '@/components/PublicHeader'
import ProfileTrend from '@/components/ProfileTrend'
import { matchTrendPoints } from '@/lib/profile'
import type { ProfileData, ProfileIdentity } from '@/lib/profile'
import type { Metric } from '@/components/mockup/Curves'

import IdentitySection, { type Achievement } from '@/app/mockup/_components/IdentitySection'
import AnalysisSection from '@/app/mockup/_components/AnalysisSection'
import FeedSection     from '@/app/mockup/_components/FeedSection'
import { CompetitionHistory } from './CompetitionHistory'

import CurveSheet    from '@/app/mockup/_components/sheets/CurveSheet'
import WhatIfSheet   from '@/app/mockup/_components/sheets/WhatIfSheet'
import DuellSheet    from '@/app/mockup/_components/sheets/DuellSheet'
import MatchSheet    from '@/app/mockup/_components/sheets/MatchSheet'
import BkRatingSheet from '@/app/mockup/_components/sheets/BkRatingSheet'

const BG  = '#0b0d10'
const INK = '#f4f5f7'

type SheetType = 'curve' | 'whatif' | 'duell' | 'match' | 'bkrating' | null

const JUNIOR_NOTICE = 'Minderårig — följning öppnas när profilen är verifierad av vårdnadshavare eller lagledare.'

/** Replaces FollowButton when a junior profile hasn't been claimed yet (locked launch policy). */
function JuniorFollowNotice({ size }: { size: 'sm' | 'md' }) {
  return (
    <span style={{
      fontSize: size === 'sm' ? 10 : 11, color: 'rgba(244,245,247,0.40)',
      maxWidth: size === 'sm' ? 160 : 220, textAlign: 'right', lineHeight: 1.4,
    }}>
      {JUNIOR_NOTICE}
    </span>
  )
}

export interface PlayerProfileViewProps {
  playerId: string
  data: ProfileData
  identity: ProfileIdentity
  /** Percentile band shown in the identity caption. */
  bkTopPct: number
  /** Official BITS licence average — shown as the primary snitt hero. */
  licenceAverage?: number | null
  firstName: string
  initials: string
  /** Previous-season per-match averages — DNA overlay + duel ghost line. */
  prevMatchAvgs?: number[]
  achievements?: Achievement[]
  isOwner?: boolean
  onEdit?: () => void
  onOpenCard?: () => void
  onOpenH2H?: () => void
}

export default function PlayerProfileView({
  playerId, data, identity, bkTopPct, licenceAverage, firstName, initials,
  prevMatchAvgs, achievements = [], isOwner = false,
  onEdit, onOpenCard, onOpenH2H,
}: PlayerProfileViewProps) {
  const [expanded, setExpanded]     = useState<SheetType>(null)
  const [curveMetric, setCurveMetric] = useState<Metric>('snitt')
  const [matchTapped, setMatchTapped] = useState<number | null>(null)

  const { matchAvgs, seasonAvg, recentAvg, formDiff, lastSeasonAvg } = data
  const allGames   = data.matches.flatMap(m => m.games.filter(g => g > 0))
  const totalSum   = allGames.reduce((a, b) => a + b, 0)
  const totalGames = allGames.length
  const projAvg    = totalGames ? Math.round((totalSum + 210 * 4) / (totalGames + 4)) : seasonAvg
  const projDiff   = projAvg - seasonAvg
  const firstDate  = data.matches[0]?.date ?? ''
  const lastDate   = data.matches[data.matches.length - 1]?.date ?? ''

  const close    = () => { setExpanded(null); setMatchTapped(null) }
  const closeAll = () => { close() }
  const openMatch = (i: number) => { setMatchTapped(i); setExpanded('match') }

  const onShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: identity.name, url: typeof location !== 'undefined' ? location.href : undefined }).catch(() => {})
    }
  }

  const pulsPoints = matchTrendPoints(data.matches)
  // matchTrendPoints drops matches with no played games, so point index ≠ match
  // index — keep a parallel map so a tapped point opens the right match sheet.
  const pulsIdx = data.matches.reduce<number[]>((acc, m, i) => {
    if (m.games.some((g) => g > 0)) acc.push(i)
    return acc
  }, [])
  const isSheetOpen = expanded !== null

  // No matches yet — show a quiet identity header + empty state.
  if (!data.hasData) {
    return (
      <main style={{ minHeight: '100vh', background: BG, color: INK }}>
        <PublicHeader />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: '#1c2127', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#f5c200', letterSpacing: -0.5 }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15 }}>{identity.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(244,245,247,0.64)', marginTop: 3 }}>{identity.teamLabel}</div>
            </div>
            {isOwner && onEdit ? (
              <button onClick={onEdit}
                style={{ flexShrink: 0, minHeight: 40, padding: '0 18px', borderRadius: 999, cursor: 'pointer',
                  border: '1px solid rgba(244,245,247,0.14)', background: 'transparent', color: INK, fontSize: 13, fontWeight: 700 }}>
                Redigera
              </button>
            ) : identity.isJunior && !identity.isClaimed ? (
              <JuniorFollowNotice size="md" />
            ) : (
              <FollowButton entityType="player" entityId={playerId} size="md" />
            )}
          </div>
          <div style={{ marginTop: 40, textAlign: 'center', color: 'rgba(244,245,247,0.40)', fontSize: 14 }}>
            Ingen matchdata än den här säsongen.
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: BG, color: INK }}>
      <style>{`
        @keyframes count-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .hero-in { animation: count-in 0.28s cubic-bezier(0.25,0.46,0.45,0.94); }

        /* Public player page — single column on mobile, wide magazine on desktop */
        .pp-canvas { max-width: 600px; margin: 0 auto; padding-bottom: 120px; }
        @media (min-width: 1024px) {
          .pp-canvas { max-width: 1160px; padding-left: 32px; padding-right: 32px; }
          .pp-grid { display: grid; grid-template-columns: 380px 1fr; gap: 40px; align-items: start; }
          .pp-side { position: sticky; top: 24px; align-self: start; }
        }
      `}</style>
      <PublicHeader />

      <div style={{
        transition: 'filter 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        filter: isSheetOpen ? 'brightness(0.72)' : 'none',
        transform: isSheetOpen ? 'scale(0.97)' : 'scale(1)',
        transformOrigin: 'center 40%',
      }}>
        <div className="pp-canvas">

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '12px 20px 0' }}>
            {isOwner && onEdit && (
              <button onClick={onEdit}
                style={{ minHeight: 34, padding: '0 14px', borderRadius: 999, cursor: 'pointer',
                  border: '1px solid rgba(244,245,247,0.14)', background: 'transparent',
                  color: 'rgba(244,245,247,0.64)', fontSize: 12, fontWeight: 700 }}>
                Redigera profil
              </button>
            )}
            {!isOwner && (
              identity.isJunior && !identity.isClaimed
                ? <JuniorFollowNotice size="sm" />
                : <FollowButton entityType="player" entityId={playerId} size="sm" />
            )}
          </div>

          <div className="pp-grid">
          <div className="pp-side">
          <IdentitySection
            data={data}
            identity={identity}
            bkTopPct={bkTopPct}
            licenceAverage={licenceAverage ?? undefined}
            bkRating={null}                /* launch state: "kommer snart" */
            achievements={achievements}
            isOwner={isOwner}
            onOpenCurve={(m) => { setCurveMetric(m ?? 'snitt'); setExpanded('curve') }}
            onOpenChallenges={() => {}}
            onOpenBkRating={() => setExpanded('bkrating')}
            onOpenCard={onOpenCard}
            onOpenH2H={onOpenH2H}
            onShare={onShare}
          />
          </div>

          <div className="pp-main">
          {pulsPoints.length > 1 && (
            <section style={{ padding: '28px 20px 0' }}>
              <div style={{ color: 'rgba(244,245,247,0.56)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>PROFIL-PULS</div>
              <ProfileTrend
                points={pulsPoints}
                caption="Snitt match för match"
                baseline={seasonAvg}
                baselineLabel="matchsnitt"
                footerLeft={`Lägst ${Math.min(...pulsPoints.map((p) => p.avg))}`}
                footerRight={`Högst ${Math.max(...pulsPoints.map((p) => p.avg))}`}
                onSelect={(i) => openMatch(pulsIdx[i])}
              />
            </section>
          )}

          <Reveal direction="up" distance={16}>
            <AnalysisSection
              data={data}
              firstName={firstName}
              onOpenCurve={() => { setCurveMetric('snitt'); setExpanded('curve') }}
            />
          </Reveal>

          <Reveal direction="up" delay={0.05}>
            <FeedSection
              data={data}
              challenges={[]}
              reactions={{}}
              projAvg={projAvg}
              projDiff={projDiff}
              onOpenChallenges={() => {}}
              onOpenWhatIf={() => setExpanded('whatif')}
              onOpenDuell={() => setExpanded('duell')}
              onOpenMatch={openMatch}
            />
          </Reveal>

          <CompetitionHistory playerId={playerId} />
          </div>
          </div>
        </div>
      </div>

      {/* Dark overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9, background: 'rgba(0,0,0,0.45)',
        opacity: isSheetOpen ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: isSheetOpen ? 'auto' : 'none', cursor: 'default',
      }} onClick={closeAll} />

      {/* ── Sheets ── */}
      {expanded === 'curve' && (
        <CurveSheet
          matchAvgs={matchAvgs}
          matches={data.matches}
          upcoming={[]}
          seasonAvg={seasonAvg}
          formDiff={formDiff}
          recentAvg={recentAvg}
          initialMetric={curveMetric}
          onClose={close}
        />
      )}

      {expanded === 'whatif' && (
        <WhatIfSheet
          seasonAvg={seasonAvg}
          totalSum={totalSum}
          totalGames={totalGames}
          onClose={close}
        />
      )}

      {expanded === 'bkrating' && (
        <BkRatingSheet bkTopPct={bkTopPct} onClose={close} />
      )}

      {expanded === 'duell' && (
        <DuellSheet
          matchAvgs={matchAvgs}
          lastSeasonAvgs={prevMatchAvgs && prevMatchAvgs.length > 1 ? prevMatchAvgs : matchAvgs.map(() => lastSeasonAvg)}
          firstDate={firstDate}
          lastDate={lastDate}
          onClose={close}
        />
      )}

      {expanded === 'match' && matchTapped !== null && (
        <MatchSheet
          match={data.matches[matchTapped]}
          matchIdx={matchTapped}
          totalMatches={data.matches.length}
          seasonAvg={seasonAvg}
          isDnaSpoke={false}
          onClose={close}
        />
      )}

    </main>
  )
}
