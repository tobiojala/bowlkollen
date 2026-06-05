'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import {
  calcLineupRating,
  getLineupTier,
  laguttagningAvailStrip,
  laguttagningBackLink,
  laguttagningBordCard,
  laguttagningBordHeader,
  laguttagningBordLabel,
  laguttagningDialAnalysis,
  laguttagningDialCell,
  laguttagningDialCenter,
  laguttagningDialFooter,
  laguttagningDialLabel,
  laguttagningDialRing,
  laguttagningDialRow,
  laguttagningDialWrap,
  laguttagningDraftBtn,
  laguttagningEmptySlot,
  laguttagningEyebrow,
  laguttagningGridBorderR,
  laguttagningGridSplit,
  laguttagningHeader,
  laguttagningMeta,
  laguttagningMiniBordCard,
  laguttagningPageRoot,
  laguttagningPlayerCard,
  laguttagningPlayerCardUsed,
  laguttagningPublishBtn,
  laguttagningPublishedBadge,
  laguttagningRatingBox,
  laguttagningRatingLabel,
  laguttagningRatingValue,
  laguttagningReserveHeader,
  laguttagningReserveLabel,
  laguttagningSlotRow,
  laguttagningSplitDone,
  laguttagningSplitLeft,
  laguttagningSplitRight,
  laguttagningSplitRoot,
  laguttagningTitle,
  lineupAvailChipStyle,
  lineupAvailMiniAvatarStyle,
  lineupAvailabilityColor,
  lineupFormDotClass,
  lineupPickerAvatarStyle,
  lineupPickerCardStyle,
  lineupPickerHeaderStyle,
  lineupTierAvatarStyle,
  lineupTierTextStyle,
} from '@/lib/team-laguttagning-ui'

type Props = { params: Promise<{ id: string; matchid: string }> }

type Player = {
  id: string
  name: string
  teamName: string
  avg: number
  bestSeries: number
  over200: number
  rating: number
  tier: string
  color: string
  bgColor: string
  borderColor: string
}

type Slot = { bord: number; position: number; player: Player | null; isReserve: boolean }

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function initials(n: string) {
  return n
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function stars(rating: number) {
  const s = Math.round(rating / 20)
  return { filled: s, empty: 5 - s }
}

function MatchupDials({ teamId, oppId }: { teamId: string; oppId: string }) {
  const [stats, setStats] = useState<{
    myAvg: number
    oppAvg: number
    my200pm: number
    opp200pm: number
    myForm: string[]
    h2hW: number
    h2hL: number
  } | null>(null)

  useEffect(() => {
    if (!teamId || !oppId) return
    const supabase = createClient()
    Promise.all([
      supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .eq('status', 'completed')
        .not('home_score', 'is', null),
      supabase.from('match_results').select('games').eq('team_id', teamId),
      supabase.from('match_results').select('games').eq('team_id', oppId),
      supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .or(
          `and(home_team_id.eq.${teamId},away_team_id.eq.${oppId}),and(home_team_id.eq.${oppId},away_team_id.eq.${teamId})`,
        )
        .eq('status', 'completed')
        .not('home_score', 'is', null),
    ]).then(([{ data: myMatches }, { data: myR }, { data: oppR }, { data: h2h }]) => {
      const myGames = (myR || []).flatMap((r: { games?: number[] }) =>
        (r.games || []).filter((g: number) => g > 0),
      )
      const oppGames = (oppR || []).flatMap((r: { games?: number[] }) =>
        (r.games || []).filter((g: number) => g > 0),
      )
      const myAvg =
        myGames.length > 0 ? Math.round(myGames.reduce((a, b) => a + b, 0) / myGames.length) : 0
      const oppAvg =
        oppGames.length > 0 ? Math.round(oppGames.reduce((a, b) => a + b, 0) / oppGames.length) : 0
      const my200 = myGames.filter((g: number) => g >= 200).length
      const opp200 = oppGames.filter((g: number) => g >= 200).length
      const myMatchCount = Math.max(1, (myMatches || []).length)
      const my200pm = Math.round((my200 / myMatchCount) * 10) / 10
      const opp200pm =
        oppR && oppR.length > 0
          ? Math.round((opp200 / Math.max(1, oppR.length / 8)) * 10) / 10
          : 0
      const myForm = (myMatches || []).slice(0, 5).map((m: Record<string, unknown>) => {
        const isHome = m.home_team_id === teamId
        const ms = isHome ? (m.home_score as number) : (m.away_score as number)
        const ts = isHome ? (m.away_score as number) : (m.home_score as number)
        return ms > ts ? 'V' : ms < ts ? 'F' : 'O'
      })
      let h2hW = 0
      let h2hL = 0
      ;(h2h || []).forEach((m: Record<string, unknown>) => {
        const isHome = m.home_team_id === teamId
        const ms = isHome ? (m.home_score as number) : (m.away_score as number)
        const ts = isHome ? (m.away_score as number) : (m.home_score as number)
        if (ms > ts) h2hW++
        else if (ms < ts) h2hL++
      })
      setStats({ myAvg, oppAvg, my200pm, opp200pm, myForm, h2hW, h2hL })
    })
  }, [teamId, oppId])

  if (!stats) return null

  const circ = (val: number, max: number, r: number) => {
    const c = 2 * Math.PI * r
    return { c, offset: c * (1 - Math.min(val / max, 1)) }
  }

  const avgC = circ(stats.myAvg, 280, 28)
  const oppAvgC = circ(stats.oppAvg, 280, 28)
  const c200 = circ(stats.my200pm, 8, 34)
  const opp200c = circ(stats.opp200pm, 8, 34)
  const formC = circ(stats.myForm.filter(f => f === 'V').length, 5, 28)
  const avgAdv = stats.myAvg > stats.oppAvg
  const avgDelta = stats.myAvg - stats.oppAvg
  const twoHundredAdv = stats.my200pm >= stats.opp200pm

  return (
    <div className={laguttagningDialWrap}>
      <div className={laguttagningDialRow}>
        <div className={laguttagningDialCell}>
          <div className={cn(laguttagningDialRing, 'h-[72px] w-[72px]')}>
            <svg width="72" height="72" viewBox="0 0 72 72" className="block">
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                className="stroke-[#e0e8f0] dark:stroke-[#1c2840]"
                strokeWidth="5"
              />
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                className="stroke-[#c8d4e8] dark:stroke-[#2a3858]"
                strokeWidth="5"
                strokeDasharray={oppAvgC.c}
                strokeDashoffset={oppAvgC.offset}
                transform="rotate(-90 36 36)"
                strokeLinecap="round"
              />
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                stroke="#7f77dd"
                strokeWidth="5"
                strokeDasharray={avgC.c}
                strokeDashoffset={avgC.offset}
                transform="rotate(-90 36 36)"
                strokeLinecap="round"
              />
            </svg>
            <div className={laguttagningDialCenter}>
              <div className="text-[13px] font-extrabold leading-none text-[#afa9ec]">
                {stats.myAvg || '—'}
              </div>
              <div className="text-[8px] text-dark-muted">{stats.oppAvg || '—'}</div>
            </div>
          </div>
          <div className={laguttagningDialLabel}>SNITT</div>
          <div
            className={cn(
              'mt-px text-[10px] font-bold',
              avgAdv ? 'text-[#7f77dd]' : 'text-[#e24b4a]',
            )}
          >
            {avgDelta >= 0 ? '+' : ''}
            {avgDelta}
          </div>
        </div>

        <div className={laguttagningDialCell}>
          <div className={cn(laguttagningDialRing, 'h-[88px] w-[88px]')}>
            <svg width="88" height="88" viewBox="0 0 88 88" className="block">
              <circle
                cx="44"
                cy="44"
                r="34"
                fill="none"
                className="stroke-[#e0e8f0] dark:stroke-[#1c2840]"
                strokeWidth="6"
              />
              <circle
                cx="44"
                cy="44"
                r="34"
                fill="none"
                className="stroke-[#c8d4e8] dark:stroke-[#2a3858]"
                strokeWidth="6"
                strokeDasharray={opp200c.c}
                strokeDashoffset={opp200c.offset}
                transform="rotate(-90 44 44)"
                strokeLinecap="round"
              />
              <circle
                cx="44"
                cy="44"
                r="34"
                fill="none"
                stroke="#1d9e75"
                strokeWidth="6"
                strokeDasharray={c200.c}
                strokeDashoffset={c200.offset}
                transform="rotate(-90 44 44)"
                strokeLinecap="round"
              />
            </svg>
            <div className={laguttagningDialCenter}>
              <div
                className={cn(
                  'text-base font-black leading-none',
                  twoHundredAdv ? 'text-[#1d9e75]' : 'text-[#e24b4a]',
                )}
              >
                {stats.my200pm}
              </div>
              <div className="text-[9px] text-dark-muted">{stats.opp200pm}</div>
            </div>
          </div>
          <div className={laguttagningDialLabel}>200+ / MATCH</div>
          <div
            className={cn(
              'mt-px text-[10px] font-bold',
              twoHundredAdv ? 'text-[#1d9e75]' : 'text-[#e24b4a]',
            )}
          >
            {twoHundredAdv ? 'Fordel' : 'Nackdel'}
          </div>
        </div>

        <div className={laguttagningDialCell}>
          <div className={cn(laguttagningDialRing, 'h-[72px] w-[72px]')}>
            <svg width="72" height="72" viewBox="0 0 72 72" className="block">
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                className="stroke-[#e0e8f0] dark:stroke-[#1c2840]"
                strokeWidth="5"
              />
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                stroke="#f5c200"
                strokeWidth="5"
                strokeDasharray={formC.c}
                strokeDashoffset={formC.offset}
                transform="rotate(-90 36 36)"
                strokeLinecap="round"
              />
            </svg>
            <div className={laguttagningDialCenter}>
              <div className="text-[13px] font-extrabold leading-none text-gold">
                {stats.myForm.filter(f => f === 'V').length}V
              </div>
              <div className="text-[8px] text-[#e24b4a]">
                {stats.myForm.filter(f => f === 'F').length}F
              </div>
            </div>
          </div>
          <div className={laguttagningDialLabel}>FORM</div>
          <div className="mt-1 flex justify-center gap-0.5">
            {stats.myForm.map((f, i) => (
              <div key={i} className={cn('h-1.5 w-1.5 rounded-full', lineupFormDotClass(f))} />
            ))}
          </div>
        </div>
      </div>
      <div className={laguttagningDialFooter}>
        <div className={laguttagningDialAnalysis}>
          <span className="font-bold">Analys: </span>
          {avgAdv
            ? 'Ni har snittfordel — satsa starka par pa Bord 1 och 2'
            : 'Motstandaren har snittfordel — fokus pa konsistens'}
        </div>
      </div>
    </div>
  )
}

export function TeamLaguttagningPageContent({ params }: Props) {
  const [teamId, setTeamId] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [match, setMatch] = useState<Record<string, unknown> | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(false)
  const [lineupId, setLineupId] = useState<string | null>(null)
  const [splitMode, setSplitMode] = useState(false)
  const [availability, setAvailability] = useState<Record<string, string>>({})
  const [availNotes, setAvailNotes] = useState<Record<string, string>>({})
  const [activeSlot, setActiveSlot] = useState<{
    bord: number
    position: number
    isReserve: boolean
  } | null>(null)

  useEffect(() => {
    params.then(p => {
      setTeamId(p.id)
      setMatchId(p.matchid)
    })
  }, [params])

  useEffect(() => {
    if (!teamId || !matchId) return
    const supabase = createClient()
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      const { data: membership } = await supabase
        .from('team_members')
        .select('role,status')
        .eq('team_id', teamId)
        .eq('user_id', session.user.id)
        .single()
      if (
        !membership ||
        membership.status !== 'active' ||
        !['captain', 'admin'].includes(membership.role)
      ) {
        window.location.href = `/team/${teamId}/intern`
        return
      }
      const { data: m } = await supabase
        .from('matches')
        .select('*, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .eq('id', matchId)
        .single()
      if (m) setMatch(m as Record<string, unknown>)

      const { data: teamPlayers } = await supabase
        .from('players')
        .select('id, name, team_id, teams:team_id(name)')
        .eq('team_id', teamId)
        .order('name')
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('status', 'active')
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', (members || []).map((mem: { user_id: string }) => mem.user_id))
      const { data: results } = await supabase
        .from('match_results')
        .select('player_id, games')
        .eq('team_id', teamId)

      const playerMap: Record<string, { games: number[]; name: string; teamName: string }> = {}
      teamPlayers?.forEach((p: Record<string, unknown>) => {
        playerMap[p.id as string] = {
          games: [],
          name: p.name as string,
          teamName: shortName(((p.teams as { name?: string })?.name) || ''),
        }
      })
      profiles?.forEach((p: { id: string; full_name: string }) => {
        if (p.full_name && !Object.values(playerMap).find(x => x.name === p.full_name)) {
          playerMap[p.id] = { games: [], name: p.full_name, teamName: '' }
        }
      })
      results?.forEach((r: { player_id: string; games?: number[] }) => {
        if (playerMap[r.player_id]) {
          playerMap[r.player_id].games.push(...(r.games || []).filter((g: number) => g > 0))
        }
      })

      const built: Player[] = Object.entries(playerMap)
        .map(([id, data]) => {
          const games = data.games
          const avg =
            games.length > 0 ? Math.round(games.reduce((a, b) => a + b, 0) / games.length) : 180
          const seriesGroups = Array.from(
            { length: Math.floor(games.length / 4) },
            (_, i) => games.slice(i * 4, i * 4 + 4).reduce((a, b) => a + b, 0),
          )
          const bestSeries =
            seriesGroups.length > 0
              ? Math.max(...seriesGroups)
              : games.reduce((a, b) => a + b, 0) || 680
          const over200 = games.filter(g => g >= 200).length
          const rating = calcLineupRating(avg, bestSeries, over200, games.length > 0)
          const tier = getLineupTier(rating)
          return {
            id,
            name: data.name,
            teamName: data.teamName,
            avg,
            bestSeries,
            over200,
            rating,
            tier: tier.label,
            color: tier.color,
            bgColor: tier.bg,
            borderColor: tier.border,
          }
        })
        .sort((a, b) => b.rating - a.rating)

      setPlayers(built)
      const initSlots: Slot[] = []
      for (let bord = 1; bord <= 4; bord++) {
        for (let pos = 1; pos <= 2; pos++) {
          initSlots.push({ bord, position: pos, player: null, isReserve: false })
        }
      }
      initSlots.push({ bord: 0, position: 1, player: null, isReserve: true })
      initSlots.push({ bord: 0, position: 2, player: null, isReserve: true })

      const { data: lineup } = await supabase
        .from('lineups')
        .select('*, lineup_slots(*)')
        .eq('team_id', teamId)
        .eq('match_id', matchId)
        .single()

      if (lineup) {
        setLineupId(lineup.id)
        setPublished(lineup.status === 'published')
        setSlots(
          initSlots.map(slot => {
            const ex = (lineup.lineup_slots as Record<string, unknown>[] | undefined)?.find(
              (s: Record<string, unknown>) =>
                s.bord === slot.bord &&
                s.position === slot.position &&
                s.is_reserve === slot.isReserve,
            )
            if (ex) {
              const p = built.find(
                x => x.id === ex.user_id || x.name === (ex.player_name as string),
              )
              return { ...slot, player: p || null }
            }
            return slot
          }),
        )
      } else {
        setSlots(initSlots)
      }
      setLoading(false)
    }
    load()
  }, [teamId, matchId])

  const getSlot = (bord: number, pos: number, isReserve = false) =>
    slots.find(s => s.bord === bord && s.position === pos && s.isReserve === isReserve)

  const usedIds = slots.filter(s => s.player).map(s => s.player!.id)

  const openPicker = (bord: number, position: number, isReserve: boolean) => {
    setActiveSlot({ bord, position, isReserve })
    setSplitMode(true)
  }

  const assignPlayer = (player: Player) => {
    if (!activeSlot) return
    setSlots(prev =>
      prev.map(s =>
        s.bord === activeSlot.bord &&
        s.position === activeSlot.position &&
        s.isReserve === activeSlot.isReserve
          ? { ...s, player }
          : s,
      ),
    )
    const allSlots = [...slots].filter(s => !s.player)
    const currentIdx = allSlots.findIndex(
      s =>
        s.bord === activeSlot.bord &&
        s.position === activeSlot.position &&
        s.isReserve === activeSlot.isReserve,
    )
    const next = allSlots[currentIdx + 1]
    if (next) {
      setActiveSlot({ bord: next.bord, position: next.position, isReserve: next.isReserve })
    } else {
      setSplitMode(false)
      setActiveSlot(null)
    }
  }

  const clearSlot = (bord: number, pos: number, isReserve: boolean) => {
    setSlots(prev =>
      prev.map(s =>
        s.bord === bord && s.position === pos && s.isReserve === isReserve
          ? { ...s, player: null }
          : s,
      ),
    )
  }

  const saveLineup = async (publish: boolean) => {
    if (!teamId || !matchId) return
    setSaving(true)
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    let lid = lineupId
    if (!lid) {
      const { data: nl } = await supabase
        .from('lineups')
        .insert({
          team_id: teamId,
          match_id: matchId,
          created_by: session.user.id,
          status: publish ? 'published' : 'draft',
        })
        .select('id')
        .single()
      if (nl) lid = nl.id
    } else {
      await supabase
        .from('lineups')
        .update({ status: publish ? 'published' : 'draft' })
        .eq('id', lid)
    }
    if (!lid) {
      setSaving(false)
      return
    }
    setLineupId(lid)
    await supabase.from('lineup_slots').delete().eq('lineup_id', lid)
    const toInsert = slots
      .filter(s => s.player)
      .map(s => ({
        lineup_id: lid,
        user_id: s.player!.id,
        player_name: s.player!.name,
        bord: s.bord,
        position: s.position,
        is_reserve: s.isReserve,
      }))
    if (toInsert.length > 0) await supabase.from('lineup_slots').insert(toInsert)
    if (publish) setPublished(true)
    setSaving(false)
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const avOrder: Record<string, number> = { yes: 0, maybe: 1, '': 2, no: 3 }
    const aAv = availability[a.id] || ''
    const bAv = availability[b.id] || ''
    if (avOrder[aAv] !== avOrder[bAv]) return avOrder[aAv] - avOrder[bAv]
    return b.rating - a.rating
  })

  const filledCount = slots.filter(s => s.player && !s.isReserve).length
  const teamRating =
    filledCount > 0
      ? Math.round(
          slots.filter(s => s.player && !s.isReserve).reduce((a, s) => a + s.player!.rating, 0) /
            filledCount,
        )
      : 0

  const home = match?.home as { name?: string } | undefined
  const away = match?.away as { name?: string } | undefined
  const isHome = match?.home_team_id === teamId
  const opp = isHome ? away : home

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-sans text-dark-muted">
        Laddar...
      </div>
    )
  }

  const SlotView = ({
    bord,
    pos,
    isReserve = false,
    compact = false,
  }: {
    bord: number
    pos: number
    isReserve?: boolean
    compact?: boolean
  }) => {
    const slot = getSlot(bord, pos, isReserve)
    const p = slot?.player
    const tier = p ? getLineupTier(p.rating) : null
    const isActive =
      activeSlot?.bord === bord &&
      activeSlot?.position === pos &&
      activeSlot?.isReserve === isReserve

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => (p ? clearSlot(bord, pos, isReserve) : openPicker(bord, pos, isReserve))}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            p ? clearSlot(bord, pos, isReserve) : openPicker(bord, pos, isReserve)
          }
        }}
        className={laguttagningSlotRow(isActive, compact)}
      >
        {p && tier ? (
          <>
            <div
              className="flex shrink-0 items-center justify-center rounded-full font-extrabold"
              style={lineupTierAvatarStyle(tier, compact)}
            >
              {initials(p.name)}
            </div>
            <div className="min-w-0">
              <div
                className={cn(
                  'truncate font-bold text-light-text dark:text-dark-text',
                  compact ? 'text-[11px]' : 'text-xs',
                )}
              >
                {p.name.split(' ')[0]}
              </div>
              <div className="text-[9px] font-semibold" style={lineupTierTextStyle(tier)}>
                {tier.label}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className={cn(
                laguttagningEmptySlot(isActive),
                compact ? 'h-[22px] w-[22px]' : 'h-[26px] w-[26px]',
              )}
            >
              +
            </div>
            <div
              className={cn(
                compact ? 'text-[10px]' : 'text-[11px]',
                isActive ? 'font-semibold text-gold' : 'text-dark-muted',
              )}
            >
              {isReserve ? 'Reserv' : `Position ${pos}`}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={cn(laguttagningPageRoot, splitMode && 'pb-0')} data-split={splitMode || undefined}>
      <div className={laguttagningHeader}>
        <a href={`/team/${teamId}/intern`} className={laguttagningBackLink}>
          ← Lagets sida
        </a>
        <div className="flex items-start justify-between">
          <div>
            <div className={laguttagningEyebrow}>LAGUTTAGNING</div>
            <div className={laguttagningTitle}>vs {shortName(opp?.name || '')}</div>
            <div className={laguttagningMeta}>
              {match?.date
                ? new Date(match.date as string).toLocaleDateString('sv-SE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : ''}{' '}
              · {isHome ? 'Hemma' : 'Borta'}
            </div>
          </div>
          {teamRating > 0 && (
            <div className={laguttagningRatingBox}>
              <div className={laguttagningRatingValue}>{teamRating}</div>
              <div className={laguttagningRatingLabel}>LAGRATING</div>
            </div>
          )}
        </div>
        {published && <div className={laguttagningPublishedBadge}>Publicerad</div>}
        <MatchupDials
          teamId={teamId!}
          oppId={(isHome ? match?.away_team_id : match?.home_team_id) as string}
        />
      </div>

      {Object.keys(availability).length > 0 && (
        <div className={laguttagningAvailStrip}>
          <div className="mb-2 text-[9px] font-bold tracking-widest text-dark-muted">
            TILLGANGLIGHET
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortedPlayers.map(p => {
              const av = availability[p.id]
              if (!av) return null
              const tier = getLineupTier(p.rating)
              const avColor = lineupAvailabilityColor(av)
              const avEmoji = av === 'yes' ? '✅' : av === 'maybe' ? '🤔' : '❌'
              const note = availNotes[p.id]
              return (
                <div
                  key={p.id}
                  title={note || ''}
                  className="flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5"
                  style={lineupAvailChipStyle(avColor)}
                >
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[7px] font-extrabold"
                    style={lineupAvailMiniAvatarStyle(tier)}
                  >
                    {initials(p.name)}
                  </div>
                  <span className="text-[11px] font-semibold">{p.name.split(' ')[0]}</span>
                  <span className="text-xs">{avEmoji}</span>
                  {note && <span className="text-[10px] italic text-dark-muted">&quot;{note}&quot;</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!splitMode ? (
        <div className="px-5 py-3.5">
          {[1, 2, 3, 4].map(bord => {
            const bordSlots = slots.filter(s => s.bord === bord && !s.isReserve)
            const bordRating =
              bordSlots.filter(s => s.player).length === 2
                ? Math.round(
                    bordSlots.reduce((a, s) => a + (s.player?.rating || 0), 0) / 2,
                  )
                : 0
            return (
              <div key={bord} className={laguttagningBordCard}>
                <div className={laguttagningBordHeader}>
                  <span className={laguttagningBordLabel}>BORD {bord}</span>
                  {bordRating > 0 && (
                    <span className="text-[10px] font-semibold text-[#1d9e75]">★ {bordRating}</span>
                  )}
                </div>
                <div className={laguttagningGridSplit}>
                  <div className={laguttagningGridBorderR}>
                    <SlotView bord={bord} pos={1} />
                  </div>
                  <div>
                    <SlotView bord={bord} pos={2} />
                  </div>
                </div>
              </div>
            )
          })}

          <div className={laguttagningBordCard}>
            <div className={laguttagningReserveHeader}>
              <span className={laguttagningReserveLabel}>RESERVER</span>
            </div>
            <div className={laguttagningGridSplit}>
              <div className={laguttagningGridBorderR}>
                <SlotView bord={0} pos={1} isReserve />
              </div>
              <div>
                <SlotView bord={0} pos={2} isReserve />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <button
              type="button"
              onClick={() => saveLineup(false)}
              disabled={saving}
              className={laguttagningDraftBtn}
            >
              Utkast
            </button>
            <button
              type="button"
              onClick={() => saveLineup(true)}
              disabled={saving}
              className={laguttagningPublishBtn}
            >
              {saving ? 'Publicerar...' : published ? 'Uppdatera' : 'Publicera till laget'}
            </button>
          </div>
        </div>
      ) : (
        <div className={laguttagningSplitRoot}>
          <div className={laguttagningSplitLeft}>
            <div className="flex items-center justify-between px-2.5 pb-1 pt-2">
              <div className="text-[9px] font-bold tracking-wide text-dark-muted">BORD</div>
              <button
                type="button"
                onClick={() => {
                  setSplitMode(false)
                  setActiveSlot(null)
                }}
                className={laguttagningSplitDone}
              >
                Klar ✓
              </button>
            </div>
            {[1, 2, 3, 4].map(bord => (
              <div
                key={bord}
                className={laguttagningMiniBordCard(activeSlot?.bord === bord && !activeSlot?.isReserve)}
              >
                <div className={laguttagningBordHeader}>
                  <span className="text-[9px] font-extrabold tracking-wide text-gold">
                    BORD {bord}
                  </span>
                </div>
                <SlotView bord={bord} pos={1} compact />
                <SlotView bord={bord} pos={2} compact />
              </div>
            ))}
            <div className={laguttagningMiniBordCard(false)}>
              <div className={laguttagningReserveHeader}>
                <span className="text-[9px] font-extrabold tracking-wide text-dark-muted">
                  RESERVER
                </span>
              </div>
              <SlotView bord={0} pos={1} isReserve compact />
              <SlotView bord={0} pos={2} isReserve compact />
            </div>
          </div>

          <div className={laguttagningSplitRight}>
            <div className="mb-2 pl-0.5 text-[9px] font-bold tracking-wide text-dark-muted">
              {activeSlot
                ? `BORD ${activeSlot.bord || 'R'} · POS ${activeSlot.position}`
                : 'VALJ SPELARE'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sortedPlayers.map(p => {
                const tier = getLineupTier(p.rating)
                const isUsed = usedIds.includes(p.id)
                const st = stars(p.rating)
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={isUsed ? -1 : 0}
                    onClick={() => !isUsed && assignPlayer(p)}
                    onKeyDown={e => {
                      if (!isUsed && (e.key === 'Enter' || e.key === ' ')) assignPlayer(p)
                    }}
                    className={cn(
                      laguttagningPlayerCard,
                      isUsed && laguttagningPlayerCardUsed,
                      isUsed && 'border-light-border dark:border-dark-border',
                    )}
                    style={lineupPickerCardStyle(tier, isUsed)}
                  >
                    <div
                      className="relative border-b px-2 pb-1.5 pt-2.5 text-center"
                      style={lineupPickerHeaderStyle(tier)}
                    >
                      <div
                        className="absolute right-1.5 top-1.5 rounded-md px-1 py-0.5 text-[8px] font-bold dark:bg-black/30 bg-white/50"
                        style={lineupTierTextStyle(tier)}
                      >
                        {tier.label}
                      </div>
                      {availability[p.id] && (
                        <div className="absolute left-1.5 top-1.5 text-xs">
                          {availability[p.id] === 'yes'
                            ? '✅'
                            : availability[p.id] === 'maybe'
                              ? '🤔'
                              : '❌'}
                        </div>
                      )}
                      <div
                        className="mx-auto mb-1.5 flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold dark:bg-black/30 bg-white/40"
                        style={lineupPickerAvatarStyle(tier)}
                      >
                        {initials(p.name)}
                      </div>
                      <div className="text-xs font-bold">{p.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-dark-muted">
                        {p.name.split(' ').slice(1).join(' ')}
                      </div>
                      {p.teamName && (
                        <div className="mt-px text-[9px] text-dark-muted">{p.teamName}</div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-0.5 px-1.5 py-2">
                      {[
                        { label: 'SNITT', value: p.avg },
                        { label: 'BASTA', value: p.bestSeries || '—' },
                        { label: '200+', value: p.over200 },
                      ].map(s => (
                        <div
                          key={s.label}
                          className="rounded-md px-0.5 py-1 text-center dark:bg-black/20 bg-white/50"
                        >
                          <div
                            className="text-[13px] font-extrabold leading-none"
                            style={lineupTierTextStyle(tier)}
                          >
                            {s.value}
                          </div>
                          <div className="mt-px text-[7px] tracking-wide text-dark-muted">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-2 pb-2 text-center">
                      <div className="text-[11px] tracking-wide">
                        <span className="text-gold">{'★'.repeat(st.filled)}</span>
                        <span className="text-[#d0d8e8] dark:text-[#2a3858]">
                          {'★'.repeat(st.empty)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[8px] tracking-wide text-dark-muted">
                        SPELSTYRKA {p.rating}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
