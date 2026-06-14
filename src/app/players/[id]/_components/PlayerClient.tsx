'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Loader2, Check, ExternalLink, MapPin, CreditCard, Swords, TrendingUp, TrendingDown, Flame, Trophy, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useColors } from '@/components/ThemeProvider'
import { fadeUp, slideUp } from '@/lib/motion'
import { shortName } from '@/lib/utils'
import FollowButton from '@/components/FollowButton'
import PlayerCard from '@/components/PlayerCard'
import PlayerDNA from './PlayerDNA'
import PlayerMatchLog from './PlayerMatchLog'
import PlayerEditSheet from './PlayerEditSheet'
import {
  validGames, matchAvgs, gamePositionAvgs, stdDev, streaks,
  calcRating, getTier, bkTopPercent, bkBarPercent, rhythmLabel,
  characterSentence, narrativeParagraph, seasonResults,
} from '@/lib/player-stats'
import { usePlayer, usePlayerResults, useSession } from '@/lib/queries'
import type { Player, MatchResult } from '@/lib/types'
import { QUERY } from '@/lib/constants'

export default function PlayerClient({ id }: { id: string }) {
  const { C, isDark } = useColors()

  const { data: playerRaw, isLoading: playerLoading } = usePlayer(id)
  const { data: resultsRaw = [] }                      = usePlayerResults(id)
  const { data: session }                              = useSession()

  const player  = playerRaw as Player | undefined
  const results = resultsRaw as MatchResult[]

  const [team,           setTeam]           = useState<{ id: string; name: string } | null>(null)
  const [isOwner,        setIsOwner]        = useState(false)
  const [editing,        setEditing]        = useState(false)
  const [cardOpen,       setCardOpen]       = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showOverlay] = useState(false)
  const [compareOpen,    setCompareOpen]    = useState(false)
  const [compareQuery,   setCompareQuery]   = useState('')
  const [compareResults, setCompareResults] = useState<{ id: string; name: string }[]>([])

  // Fetch team + ownership once player data is available
  useEffect(() => {
    if (!player) return
    const supabase = createClient()
    if (player.team_id) {
      supabase.from('teams').select('id,name').eq('id', player.team_id).single()
        .then(({ data }) => { if (data) setTeam(data) })
    }
    if (session) {
      supabase.from('player_claims').select('id').eq('user_id', session.user.id).eq('player_id', id).single()
        .then(({ data }) => setIsOwner(!!data))
    }
  }, [player?.id, session?.user?.id])

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true)
    const supabase = createClient()
    const path = `avatars/${id}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('player-avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('player-avatars').getPublicUrl(path)
      await supabase.from('players').update({ avatar_url: publicUrl }).eq('id', id)
    }
    setUploadingAvatar(false)
  }

  const searchPlayers = async (q: string) => {
    setCompareQuery(q)
    if (q.trim().length < QUERY.SEARCH_MIN_CHARS) { setCompareResults([]); return }
    const { data } = await createClient().from('players').select('id,name').ilike('name', `%${q.trim()}%`).neq('id', id).limit(6)
    setCompareResults(data || [])
  }

  if (playerLoading) return null  // loading.tsx handles the skeleton
  if (!player) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.muted }}>Spelare hittades inte</div>
    </main>
  )

  // ── Stat computation ───────────────────────────────────────────────────────
  const currResults  = seasonResults(results, 'current')
  const prevResults  = seasonResults(results, 'prev')
  const activeRes    = currResults.length > 0 ? currResults : results

  const allGames   = validGames(activeRes)
  const hasData    = allGames.length > 0
  const seasonAvg  = hasData ? Math.round(allGames.reduce((a, b) => a + b) / allGames.length) : 0
  const seriesTots = activeRes.map(r => (r.games ?? []).filter(g => g > 0).reduce((a, b) => a + b, 0)).filter(t => t > 0)
  const bestSeries = seriesTots.length > 0 ? Math.max(...seriesTots) : 0
  const over200    = allGames.filter(g => g >= 200).length
  const over250    = allGames.filter(g => g >= 250).length
  const rating     = calcRating(seasonAvg, bestSeries, over200, hasData)
  const tier       = getTier(rating)
  const topPct     = bkTopPercent(rating)
  const barPct     = bkBarPercent(rating)

  const recent4   = activeRes.slice(0, 4).flatMap(r => (r.games ?? []).filter(g => g > 0))
  const recentAvg = recent4.length ? Math.round(recent4.reduce((a, b) => a + b) / recent4.length) : 0
  const formDiff  = hasData ? recentAvg - seasonAvg : 0

  const sd          = stdDev(allGames)
  const consistency = sd < 20 ? 'Konsekvent' : sd < 30 ? 'Stabil' : sd < 40 ? 'Varierad' : 'Explosiv'
  const hitRate     = hasData ? Math.round(over200 / allGames.length * 100) : 0
  const sAvg        = streaks(allGames, seasonAvg)
  const s200        = streaks(allGames, 200)

  const curMatchAvgs  = matchAvgs(activeRes)
  const prevMatchAvgs = matchAvgs(prevResults)
  const gameAvgs      = gamePositionAvgs(activeRes)
  const rhythm        = rhythmLabel(gameAvgs)

  const prevAllGames  = validGames(prevResults)
  const lastSeasonAvg = prevAllGames.length > 0 ? Math.round(prevAllGames.reduce((a, b) => a + b) / prevAllGames.length) : Math.max(0, seasonAvg - 5)

  const charSentence = hasData ? characterSentence({ hitRate, formDiff, consistency, seasonAvg, bestSeries }) : null
  const narrative    = hasData && lastSeasonAvg > 0 ? narrativeParagraph({
    firstName: player.name.split(' ')[0], seasonAvg, lastSeasonAvg, formDiff, hitRate,
    consistency, rhythmLabel: rhythm.label, bestSeries,
    games200Plus: over200, totalGames: allGames.length,
  }) : null

  const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue = player.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const tc  = `hsl(${hue},50%,45%)`

  const bkts = [
    { c: 'rgba(140,155,180,0.42)', v: allGames.filter(g => g < 180).length,             l: 'u.180'   },
    { c: 'rgba(160,175,200,0.65)', v: allGames.filter(g => g >= 180 && g < 200).length, l: '180–199' },
    { c: C.green,                  v: over200 - over250,                                 l: '200–249' },
    { c: C.accent,                 v: over250,                                            l: '250+'    },
  ].filter(b => b.v > 0)
  const n = allGames.length

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @keyframes dna-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.018)} }
        @keyframes dna-breathe-fast { 0%,100%{transform:scale(1)} 50%{transform:scale(1.034)} }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>

        {/* DNA Hero */}
        {curMatchAvgs.length > 2 && (
          <PlayerDNA
            matchAvgs={curMatchAvgs}
            overlayAvgs={showOverlay && prevMatchAvgs.length > 2 ? prevMatchAvgs : undefined}
            initials={initials}
            onDNATap={() => {}}
          />
        )}

        {/* Identity */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          style={{ padding: curMatchAvgs.length > 2 ? '4px 20px 0' : '20px 20px 0' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {curMatchAvgs.length <= 2 && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {player.avatar_url ? (
                    <Image src={player.avatar_url} alt={player.name} width={68} height={68}
                      style={{ borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${tier.accent}`, boxShadow: `0 0 16px ${tier.glow}` }} />
                  ) : (
                    <div style={{ width: 68, height: 68, borderRadius: '50%',
                      background: isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`,
                      border: `2.5px solid ${tier.accent}`, boxShadow: `0 0 16px ${tier.glow}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 900, color: tc }}>
                      {initials}
                    </div>
                  )}
                  {isOwner && (
                    <label style={{ position: 'absolute', bottom: 1, right: 1, width: 24, height: 24,
                      borderRadius: '50%', background: tier.accent, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                      {uploadingAvatar
                        ? <Loader2 size={12} color="#1a1400" style={{ animation: 'spin 1s linear infinite' }} />
                        : <Camera size={12} color="#1a1400" />}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                    </label>
                  )}
                </div>
              )}
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3, lineHeight: 1.2 }}>{player.name}</div>
                {isOwner && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.green+'22', borderRadius: 6, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <Check size={9} />Din profil
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {isOwner && (
                <button onClick={() => setEditing(true)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Redigera
                </button>
              )}
              {!isOwner && <FollowButton playerId={id} type="player" size="sm" isDark={isDark} />}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {team && (
              <Link href={'/teams/'+team.id} style={{ fontSize: 13, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                {shortName(team.name)}
              </Link>
            )}
            {player.hometown && <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} color={C.muted} />{player.hometown}</span>}
            {player.hand && <span style={{ fontSize: 12, color: C.muted }}>{player.hand === 'right' ? 'Höger' : 'Vänster'}hand</span>}
          </div>

          {hasData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, padding: '3px 9px', borderRadius: 20, background: tier.bg, border: `1px solid ${tier.border}`, color: tier.accent }}>{tier.label}</span>
              {formDiff !== 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: formDiff > 0 ? C.green : C.red }}>
                  {formDiff > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {formDiff > 0 ? `+${formDiff}` : formDiff}
                </span>
              )}
            </div>
          )}

          {player.bio && <div style={{ marginTop: 10, fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{player.bio}</div>}

          {(player.instagram || player.facebook || player.youtube) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              {player.instagram && <a href={`https://instagram.com/${player.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, textDecoration: 'none' }}><ExternalLink size={11} />@{player.instagram}</a>}
              {player.facebook && <a href={player.facebook} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, textDecoration: 'none' }}><ExternalLink size={11} />Facebook</a>}
              {player.youtube && <a href={player.youtube} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, textDecoration: 'none' }}><ExternalLink size={11} />YouTube</a>}
            </div>
          )}

          {hasData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '10px 14px', borderRadius: 14, background: 'rgba(93,202,165,0.06)', border: '1px solid rgba(93,202,165,0.18)' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>BK RATING</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.green, lineHeight: 1 }}>{rating}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'linear-gradient(90deg,rgba(255,255,255,0.07) 0%,rgba(93,202,165,0.4) 100%)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: `${barPct}%`, width: 13, height: 13, borderRadius: '50%', background: C.green, transform: 'translate(-50%,-50%)', boxShadow: '0 0 10px rgba(93,202,165,0.7)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>Lägst</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>Högst</span>
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.green, lineHeight: 1 }}>Top {topPct}%</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>i divisionen</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => setCardOpen(true)} style={{ flex: 1, padding: '10px 0', borderRadius: 20, border: `1px solid ${tier.border}`, background: tier.bg, color: tier.accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <CreditCard size={14} /> Spelarkort
            </button>
            <button onClick={() => { setCompareOpen(true); setCompareQuery(''); setCompareResults([]) }} style={{ flex: 1, padding: '10px 0', borderRadius: 20, border: '1px solid rgba(245,194,0,0.30)', background: 'rgba(245,194,0,0.08)', color: C.accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Swords size={14} /> H2H
            </button>
          </div>
        </motion.div>

        {/* Prestanda */}
        {hasData && (
          <motion.div variants={slideUp} initial="hidden" animate="visible" style={{ marginTop: 24, padding: '0 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 2, marginBottom: 14 }}>PRESTANDA</div>
            <div style={{ height: 8, borderRadius: 8, overflow: 'hidden', display: 'flex', gap: 2 }}>
              {bkts.map((b, i) => <div key={i} style={{ flex: b.v, background: b.c, minWidth: 4 }} />)}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              {bkts.map(b => (
                <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: b.c, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.muted }}>{b.l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: (b.c === C.accent || b.c === C.green) ? b.c : 'rgba(255,255,255,0.55)' }}>{Math.round(b.v/n*100)}%</span>
                </div>
              ))}
            </div>
            {charSentence && <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', lineHeight: 1.5 }}>{charSentence}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginTop: 16, gap: 4 }}>
              {[
                { label: 'SNITT',    value: seasonAvg, color: C.accent },
                { label: 'FORM',     value: formDiff > 0 ? `+${formDiff}` : formDiff, color: formDiff > 0 ? C.green : formDiff < 0 ? C.red : C.muted },
                { label: 'TRÄFF',    value: `${hitRate}%`, color: hitRate >= 60 ? C.accent : C.muted },
                { label: 'KARAKTÄR', value: consistency, color: 'rgba(255,255,255,0.85)', fontSize: 13 },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: (s as { fontSize?: number }).fontSize ?? 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 8, color: C.muted, marginTop: 3, letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {gameAvgs.length >= 4 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  {gameAvgs.map((avg, i) => {
                    const mn = Math.min(...gameAvgs), mx = Math.max(...gameAvgs)
                    const barH = 10 + ((avg - mn) / (mx - mn || 1)) * 26
                    const isPeak = avg === mx
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: 22, height: barH, borderRadius: 4, background: isPeak ? C.accent : 'rgba(255,255,255,0.15)', boxShadow: isPeak ? '0 0 8px rgba(245,194,0,0.4)' : undefined }} />
                        <span style={{ fontSize: 8, color: isPeak ? C.accent : C.muted, fontWeight: isPeak ? 700 : 400 }}>S{i+1}</span>
                      </div>
                    )
                  })}
                </div>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: C.muted, letterSpacing: 1.2, marginBottom: 4 }}>RYTM</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.accent, lineHeight: 1.2 }}>{rhythm.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{rhythm.detail}</div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Hot streak banner */}
        {sAvg.current >= 4 && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible"
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', marginTop: 16, background: 'linear-gradient(90deg,rgba(245,194,0,0.11) 0%,rgba(245,194,0,0.03) 100%)', borderTop: '1px solid rgba(245,194,0,0.18)', borderBottom: '1px solid rgba(245,194,0,0.18)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={20} color={C.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.accent, letterSpacing: -0.2 }}>{sAvg.current} spel i rad över snitt</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Pågående svit — håll formen vid liv</div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{sAvg.current}</div>
          </motion.div>
        )}

        {/* Season narrative */}
        {narrative && (
          <motion.div variants={slideUp} initial="hidden" animate="visible" style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: 1.5, marginBottom: 10 }}>SÄSONGEN I KORTHET</div>
            <div style={{ borderLeft: '2px solid rgba(245,194,0,0.28)', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {narrative.map((sentence, i) => (
                <p key={i} style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: i === 0 ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.52)' }}>{sentence}</p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Record chips */}
        {hasData && (
          <div style={{ display: 'flex', gap: 8, padding: '16px 20px 0', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
              <Trophy size={13} color={C.accent} />
              <span style={{ fontSize: 12, color: C.muted }}>Bästa serie:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{bestSeries}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
              <Star size={13} color={C.green} />
              <span style={{ fontSize: 12, color: C.muted }}>200+-svit:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{s200.best} spel</span>
            </div>
            {player.style && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.muted }}>Stil:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{player.style}</span>
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        {(player.achievements ?? []).length > 0 && (
          <div style={{ padding: '14px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(player.achievements ?? []).map((a, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 600, color: C.accent, background: C.accent+'18', border: `1px solid ${C.accent}44`, borderRadius: 20, padding: '4px 10px' }}>{a}</span>
            ))}
          </div>
        )}

        {/* Match log */}
        <div style={{ marginTop: 24, borderTop: `1px solid ${C.border}` }}>
          <PlayerMatchLog results={results} teamId={player.team_id} seasonAvg={seasonAvg} isDark={isDark} />
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {editing && (
          <PlayerEditSheet
            player={player}
            onSave={() => { /* React Query refetches automatically on next window focus */ }}
            onClose={() => setEditing(false)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {cardOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setCardOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <PlayerCard
              name={player.name} teamName={team?.name || ''} avatarUrl={player.avatar_url}
              avg={seasonAvg} bestSeries={bestSeries} over200={over200} matches={results.length}
              division={results[0]?.matches?.division || ''} hand={player.hand}
              style={player.style} ballBrand={player.ball_brand} bio={player.bio}
              achievements={player.achievements || []} isDark={isDark} isOwner={isOwner}
              onClose={() => setCardOpen(false)}
            />
          </div>
        </div>
      )}

      {compareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setCompareOpen(false)}>
          <div style={{ width: '100%', maxWidth: 600, background: C.surface, borderRadius: '20px 20px 0 0', padding: '20px', maxHeight: '60dvh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>Jämför med spelare</div>
            <input value={compareQuery} onChange={e => searchPlayers(e.target.value)} placeholder="Sök spelare..."
              style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            {compareResults.map(p => (
              <Link key={p.id} href={`/compare/${id}/${p.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${C.border}`, textDecoration: 'none' }}>
                <span style={{ fontSize: 15, color: C.text }}>{p.name}</span>
                <span style={{ fontSize: 13, color: C.muted }}>Jämför →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
