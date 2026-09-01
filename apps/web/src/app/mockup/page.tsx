'use client'

import { useState } from 'react'

import { MATCHES, LAST_SEASON, UPCOMING, CHALLENGES, MOCK_REACTIONS, DNA_HIGHLIGHTS, ELITSERIEN_BK_RATINGS, PLAYER_BK_RATING, BK_READY, BK_PROGRESS, RANKING_PTS, ACHIEVEMENTS, MOCK_FOLLOWERS, PLAYER_LEVEL, MATCH_HOME_AWAY, COLORS } from './data'
import { buildProfileData, type ProfileMatch, type ProfileIdentity } from '@/lib/profile'
import type { Metric } from '@/components/mockup/Curves'

import Reveal from '@/components/Reveal'

import LiveTicker      from './_components/LiveTicker'
import DnaSection      from './_components/DnaSection'
import IdentitySection from './_components/IdentitySection'
import AnalysisSection from './_components/AnalysisSection'
import FeedSection     from './_components/FeedSection'
import MomentToast     from './_components/MomentToast'

import CurveSheet      from './_components/sheets/CurveSheet'
import WhatIfSheet     from './_components/sheets/WhatIfSheet'
import ChallengesSheet from './_components/sheets/ChallengesSheet'
import DuellSheet      from './_components/sheets/DuellSheet'
import MatchSheet      from './_components/sheets/MatchSheet'
import DnaInfoSheet    from './_components/sheets/DnaInfoSheet'
import BkRatingSheet   from './_components/sheets/BkRatingSheet'
import SeasonSheet     from './_components/sheets/SeasonSheet'

type CardType = 'curve' | 'whatif' | 'challenges' | 'duell' | 'match' | 'bkrating' | 'season'

export default function MockupPage() {
  const [expanded, setExpanded]         = useState<CardType | null>(null)
  const [curveMetric, setCurveMetric]   = useState<Metric>('snitt')
  const [matchTapped, setMatchTapped]   = useState<number | null>(null)
  const [dnaSpoke, setDnaSpoke]         = useState<number | null>(null)
  const [dnaInfoOpen, setDnaInfoOpen]   = useState(false)
  const [isLive, setIsLive]             = useState(true)
  const [popupMoment, setPopupMoment]   = useState<{ score: string; label: string; sub: string; iconName: string } | null>(null)
  const [momentIdx, setMomentIdx]       = useState(0)

  // ── Computed stats ──────────────────────────────────────────────────────────
  const allGames      = MATCHES.flatMap(m => m.games)
  const matchAvgs     = MATCHES.map(m => Math.round(m.games.reduce((a, b) => a + b) / m.games.length))
  const seasonAvg     = Math.round(allGames.reduce((a, b) => a + b) / allGames.length)
  const recent4       = MATCHES.slice(-4).flatMap(m => m.games)
  const recentAvg     = Math.round(recent4.reduce((a, b) => a + b) / recent4.length)
  const formDiff      = recentAvg - seasonAvg
  const totalSum      = allGames.reduce((a, b) => a + b)
  const lastSeasonAvg = Math.round(LAST_SEASON.reduce((a, b) => a + b) / LAST_SEASON.length)
  const bkBelow       = ELITSERIEN_BK_RATINGS.filter(r => r < PLAYER_BK_RATING).length
  const bkTopPct      = Math.round((1 - bkBelow / ELITSERIEN_BK_RATINGS.length) * 100)

  // Canonical profile data — the same shape the real /players/[id] route builds
  const mockMatches: ProfileMatch[] = MATCHES.map((m, i) => ({
    date: m.date, opp: m.opp, result: m.result, games: m.games, home: MATCH_HOME_AWAY[i] === true,
  }))
  const pdata = buildProfileData(mockMatches, { lastSeasonAvg })
  const identity: ProfileIdentity = {
    name: 'Sara Holmberg', initials: 'SH', teamLabel: 'Örebro BK · Elitserien',
    followers: MOCK_FOLLOWERS.followers, following: MOCK_FOLLOWERS.following,
    isJunior: false, isClaimed: true,
  }

  // Projected avg using default slider value (210) — used in feed row
  const projAvg  = Math.round((totalSum + 210 * 4) / (allGames.length + 4))
  const projDiff = projAvg - seasonAvg

  // ── Live match data ─────────────────────────────────────────────────────────
  const liveMatch = {
    homeTeam: 'Örebro BK', awayTeam: 'Malmö BK',
    homeScore: 5, awayScore: 2,
    game: 3, totalGames: 4,
    saraGames: [201, 234],
    saraCurrentScore: 189,
  }

  const DEMO_MOMENTS = [
    { score: '278',   label: 'Personbästa!',         sub: 'Högsta spel denna säsong',    iconName: 'Star'   },
    { score: '189',   label: 'Spel 3 pågår just nu', sub: 'Örebro BK 5–2 Malmö BK',      iconName: 'Flame'  },
    { score: '96%',   label: 'Utmaning nära klar!',  sub: 'Serierekord — bara 37p kvar', iconName: 'Trophy' },
    { score: '1 013', label: 'Bästa serie i år!',    sub: '+3p på säsongssnittet',       iconName: 'Star'   },
  ]

  const triggerMoment = () => {
    setPopupMoment(null)
    setTimeout(() => {
      setPopupMoment(DEMO_MOMENTS[momentIdx % DEMO_MOMENTS.length])
      setMomentIdx(i => i + 1)
      setTimeout(() => setPopupMoment(null), 4200)
    }, 50)
  }

  // ── Sheet handlers ──────────────────────────────────────────────────────────
  const openMatch = (i: number) => { setMatchTapped(i); setExpanded('match') }
  const close     = () => { setExpanded(null); setMatchTapped(null) }
  const closeAll  = () => { close(); setDnaSpoke(null); setDnaInfoOpen(false) }

  const isToastActive = !!popupMoment
  const isSheetOpen   = expanded !== null || dnaSpoke !== null || dnaInfoOpen
  const isDepthActive = isToastActive || isSheetOpen

  return (
    <main style={{ minHeight: '100vh', background: COLORS.BG, color: '#f4f5f7' }}>
      <style>{`
        @keyframes count-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .hero-in { animation: count-in 0.28s cubic-bezier(0.25,0.46,0.45,0.94); }
      `}</style>

      {/* Depth layer — recedes when a toast/sheet is visible */}
      <div style={{
        transition: 'filter 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        filter: isToastActive ? 'blur(5px) brightness(0.65)' : isSheetOpen ? 'brightness(0.72)' : 'none',
        transform: isDepthActive ? 'scale(0.97)' : 'scale(1)',
        transformOrigin: 'center 40%',
      }}>

        <LiveTicker
          isLive={isLive}
          liveMatch={liveMatch}
          onToggleLive={() => setIsLive(v => !v)}
          onTriggerMoment={triggerMoment}
        />

        <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>

          {/* Identity first: who she is, the hero number, the curve, actions */}
          <IdentitySection
            data={pdata}
            identity={identity}
            bkTopPct={bkTopPct}
            bkRating={BK_READY ? PLAYER_BK_RATING : null}
            level={PLAYER_LEVEL}
            achievements={ACHIEVEMENTS}
            bkProgress={BK_PROGRESS}
            rankingPts={RANKING_PTS}
            onOpenCurve={(m) => { setCurveMetric(m ?? 'snitt'); setExpanded('curve') }}
            onOpenChallenges={() => setExpanded('challenges')}
            onOpenBkRating={() => setExpanded('bkrating')}
            onOpenSeason={() => setExpanded('season')}
          />

          {/* The identity artifact */}
          <DnaSection
            matchAvgs={matchAvgs}
            overlayAvgs={LAST_SEASON}
            highlights={DNA_HIGHLIGHTS}
            initials={identity.initials}
            isLive={isLive}
            onTapSpoke={setDnaSpoke}
            onDnaTap={() => setDnaInfoOpen(true)}
          />

          <Reveal direction="up" distance={16}>
            <AnalysisSection
              data={pdata}
              onOpenCurve={() => { setCurveMetric('snitt'); setExpanded('curve') }}
            />
          </Reveal>

          <Reveal direction="up" delay={0.05}>
            <FeedSection
              data={pdata}
              challenges={CHALLENGES}
              reactions={MOCK_REACTIONS}
              projAvg={projAvg}
              projDiff={projDiff}
              onOpenChallenges={() => setExpanded('challenges')}
              onOpenWhatIf={() => setExpanded('whatif')}
              onOpenDuell={() => setExpanded('duell')}
              onOpenMatch={openMatch}
            />
          </Reveal>

        </div>
      </div>{/* end depth layer */}

      {/* Dark overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9,
        background: isToastActive ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)',
        opacity: isDepthActive ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: isDepthActive && !popupMoment ? 'auto' : 'none',
        cursor: 'default',
      }} onClick={!popupMoment ? closeAll : undefined} />

      {/* Toast */}
      {popupMoment && (
        <MomentToast moment={popupMoment} momentIdx={momentIdx} />
      )}

      {/* ── Sheets ── */}
      {expanded === 'curve' && (
        <CurveSheet
          matchAvgs={matchAvgs}
          matches={pdata.matches}
          upcoming={UPCOMING}
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
          totalGames={allGames.length}
          onClose={close}
        />
      )}

      {expanded === 'challenges' && (
        <ChallengesSheet onClose={close} />
      )}

      {expanded === 'bkrating' && (
        <BkRatingSheet bkTopPct={bkTopPct} onClose={close} />
      )}
      {expanded === 'season' && (
        <SeasonSheet data={pdata} firstName={identity.name.split(' ')[0]} onClose={close} />
      )}

      {expanded === 'duell' && (
        <DuellSheet
          matchAvgs={matchAvgs}
          lastSeasonAvgs={LAST_SEASON}
          firstDate={pdata.matches[0].date}
          lastDate={pdata.matches[pdata.matches.length - 1].date}
          onClose={close}
        />
      )}

      {expanded === 'match' && matchTapped !== null && (
        <MatchSheet
          match={pdata.matches[matchTapped]}
          matchIdx={matchTapped}
          totalMatches={MATCHES.length}
          seasonAvg={seasonAvg}
          isDnaSpoke={false}
          highlight={DNA_HIGHLIGHTS.find(h => h.idx === matchTapped)}
          onClose={close}
        />
      )}

      {dnaSpoke !== null && (
        <MatchSheet
          match={pdata.matches[dnaSpoke]}
          matchIdx={dnaSpoke}
          totalMatches={MATCHES.length}
          seasonAvg={seasonAvg}
          isDnaSpoke
          highlight={DNA_HIGHLIGHTS.find(h => h.idx === dnaSpoke)}
          onClose={() => setDnaSpoke(null)}
        />
      )}

      {dnaInfoOpen && (
        <DnaInfoSheet
          matchAvgs={matchAvgs}
          matchCount={MATCHES.length}
          highlights={DNA_HIGHLIGHTS}
          initials={identity.initials}
          onClose={() => setDnaInfoOpen(false)}
        />
      )}
    </main>
  )
}
