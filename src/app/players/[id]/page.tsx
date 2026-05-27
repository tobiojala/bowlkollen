'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { MapPin, Camera, Loader2, Check, Hand, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const
import FollowButton from '@/components/FollowButton'
import PlayerCard from '@/components/PlayerCard'
import { shortName } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

type Player = {
  id: string; name: string; team_id: string | null
  bio: string | null; hand: string | null; style: string | null
  hometown: string | null; ball_brand: string | null; avatar_url: string | null
  instagram: string | null; facebook: string | null; youtube: string | null
  favorite_center: string | null; achievements: string[] | null
}

type TierInfo = { label: string; accent: string; glow: string; bg: string; border: string }

function calcRating(avg: number, best: number, over200: number, hasData: boolean) {
  if (!hasData) return Math.min(55, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 40) * 0.4 + over200 * 1.5))
}

function getTier(rating: number): TierInfo {
  if (rating >= 95) return { label: 'LEGEND',  accent: '#f5c200', glow: 'rgba(245,194,0,0.40)',   bg: 'rgba(245,194,0,0.10)',   border: 'rgba(245,194,0,0.55)' }
  if (rating >= 85) return { label: 'ELITE',   accent: '#b8a9f0', glow: 'rgba(127,119,221,0.35)', bg: 'rgba(127,119,221,0.10)', border: 'rgba(127,119,221,0.50)' }
  if (rating >= 75) return { label: 'PRO',     accent: '#5dcaa5', glow: 'rgba(29,158,117,0.30)',  bg: 'rgba(29,158,117,0.10)',  border: 'rgba(29,158,117,0.45)' }
  if (rating >= 60) return { label: 'VETERAN', accent: '#ef9f27', glow: 'rgba(186,117,23,0.28)',  bg: 'rgba(186,117,23,0.10)',  border: 'rgba(186,117,23,0.45)' }
  return               { label: 'ROOKIE',  accent: '#8899aa', glow: 'rgba(100,120,160,0.20)',  bg: 'rgba(100,120,160,0.08)', border: 'rgba(100,120,160,0.35)' }
}

function Sparkline({ games }: { games: number[] }) {
  const last = games.slice(-10)
  if (last.length < 2) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
      {last.map((g, i) => {
        const h = Math.max(4, Math.round(((g - 80) / 220) * 28))
        const color = g >= 250 ? '#5a82b4' : g >= 200 ? '#f5c200' : 'rgba(160,175,200,0.32)'
        return <div key={i} style={{ flex: 1, minWidth: 8, height: h, borderRadius: 3, background: color }} title={String(g)} />
      })}
    </div>
  )
}

export default function PlayerPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [id, setId]         = useState<string | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [team, setTeam]     = useState<{ id: string; name: string } | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [editData, setEditData] = useState<Partial<Player>>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'oversikt' | 'matchlogg'>('oversikt')
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareQuery, setCompareQuery] = useState('')
  const [compareResults, setCompareResults] = useState<{ id: string; name: string }[]>([])
  const [searchingCompare, setSearchingCompare] = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('players').select('*').eq('id', id).single(),
      supabase.from('match_results').select('*, matches:match_id(id, date, division, home_team_id, away_team_id, home_score, away_score, home:teams!home_team_id(name), away:teams!away_team_id(name))').eq('player_id', id).order('date', { ascending: false }),
      supabase.auth.getSession(),
    ]).then(async ([{ data: p }, { data: r }, { data: { session } }]) => {
      if (p) {
        setPlayer(p as Player)
        setEditData(p as Player)
        if (p.team_id) {
          const { data: t } = await supabase.from('teams').select('id, name').eq('id', p.team_id).single()
          if (t) setTeam(t)
        }
      }
      if (r) setResults(r)
      if (session) {
        const { data: claim } = await supabase.from('player_claims').select('id').eq('user_id', session.user.id).eq('player_id', id).single()
        setIsOwner(!!claim)
      }
      setLoading(false)
    })
  }, [id])

  const save = async () => {
    if (!id) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').update({
      bio: editData.bio, hand: editData.hand, style: editData.style,
      hometown: editData.hometown, ball_brand: editData.ball_brand,
      instagram: editData.instagram, facebook: editData.facebook,
      youtube: editData.youtube, favorite_center: editData.favorite_center,
      achievements: editData.achievements,
    }).eq('id', id)
    if (!error) { setPlayer(prev => prev ? { ...prev, ...editData } : null); setEditing(false) }
    setSaving(false)
  }

  const uploadAvatar = async (file: File) => {
    if (!id) return
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = 'avatars/' + id + '.' + ext
    const { error: uploadError } = await supabase.storage.from('player-avatars').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('player-avatars').getPublicUrl(path)
      await supabase.from('players').update({ avatar_url: publicUrl }).eq('id', id)
      setPlayer(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
    }
    setUploadingAvatar(false)
  }

  const searchPlayers = async (q: string) => {
    setCompareQuery(q)
    if (q.trim().length < 2) { setCompareResults([]); return }
    setSearchingCompare(true)
    const supabase = createClient()
    const { data } = await supabase.from('players').select('id, name').ilike('name', `%${q.trim()}%`).neq('id', id || '').limit(6)
    setCompareResults(data || [])
    setSearchingCompare(false)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <Loader2 size={24} color={C.textMuted} style={{ animation: 'spin 1s linear infinite' }} />
    </main>
  )
  if (!player) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Spelare hittades inte</div>
    </main>
  )

  // Stats
  const allGames     = results.flatMap(r => (r.games || []).filter((g: number) => g > 0))
  const avgScore     = allGames.length > 0 ? Math.round(allGames.reduce((a: number, b: number) => a + b, 0) / allGames.length) : 0
  const seriesTotals = results.map(r => (r.games || []).filter((g: number) => g > 0).reduce((a: number, b: number) => a + b, 0)).filter((t: number) => t > 0)
  const bestSeries   = seriesTotals.length > 0 ? Math.max(...seriesTotals) : 0
  const over200      = allGames.filter((g: number) => g >= 200).length
  const over250      = allGames.filter((g: number) => g >= 250).length
  const rating       = calcRating(avgScore, bestSeries, over200, allGames.length > 0)
  const tier         = getTier(rating)

  const recentGames  = results.slice(0, 4).flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
  const olderGames   = results.slice(4, 8).flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
  const recentAvg    = recentGames.length > 0 ? recentGames.reduce((a: number, b: number) => a + b, 0) / recentGames.length : 0
  const olderAvg     = olderGames.length > 0 ? olderGames.reduce((a: number, b: number) => a + b, 0) / olderGames.length : 0
  const formTrend    = recentGames.length === 0 ? null : olderGames.length === 0 ? 'neutral' : recentAvg > olderAvg + 5 ? 'up' : recentAvg < olderAvg - 5 ? 'down' : 'neutral'
  const trendColor   = formTrend === 'up' ? '#5dcaa5' : formTrend === 'down' ? '#e05555' : C.textMuted

  const hue  = player.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const tc   = `hsl(${hue},50%,45%)`
  const tclo = isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`

  const field = (label: string, key: keyof Player, placeholder: string, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>{label.toUpperCase()}</div>
      {editing ? (
        type === 'textarea' ? (
          <textarea value={(editData[key] as string) || ''} onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder} rows={3}
            style={{ width: '100%', background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' }} />
        ) : (
          <input value={(editData[key] as string) || ''} onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{ width: '100%', background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        )
      ) : (
        <div style={{ fontSize: 14, color: (player[key] as string) ? C.text : C.textMuted, fontStyle: (player[key] as string) ? 'normal' : 'italic' }}>
          {(player[key] as string) || placeholder}
        </div>
      )}
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>

          {/* Tier-glow banner */}
          <div style={{
            height: 100,
            background: isDark
              ? `linear-gradient(135deg, ${tier.glow.replace('0.40','0.18').replace('0.35','0.15').replace('0.30','0.13').replace('0.28','0.12').replace('0.20','0.09')} 0%, rgba(13,21,32,0) 100%)`
              : `linear-gradient(135deg, ${tier.bg} 0%, rgba(245,242,236,0) 100%)`,
            borderBottom: `1px solid ${tier.border}`,
          }} />

          {/* Avatar row */}
          <div style={{ padding: '0 20px', marginTop: -28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.name}
                    style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                      border: `3px solid ${tier.accent}`,
                      boxShadow: `0 0 0 3px ${C.bg}, 0 0 20px ${tier.glow}` }} />
                ) : (
                  <div style={{ width: 88, height: 88, borderRadius: '50%',
                    background: tclo, border: `3px solid ${tier.accent}`,
                    boxShadow: `0 0 0 3px ${C.bg}, 0 0 20px ${tier.glow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, fontWeight: 900, color: tc }}>
                    {player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                {isOwner && (
                  <label style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%',
                    background: tier.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                    {uploadingAvatar ? <Loader2 size={13} color="#1a1400" style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={13} color="#1a1400" />}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                  </label>
                )}
              </div>

              {/* Top-right actions */}
              <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
                {isOwner && !editing && (
                  <button onClick={() => setEditing(true)}
                    style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid ' + C.border, background: 'transparent', color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Redigera
                  </button>
                )}
                {!isOwner && id && (
                  <FollowButton playerId={id} type="player" size="sm" isDark={isDark} />
                )}
              </div>
            </div>

            {/* Name + tier + team */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -0.3 }}>{player.name}</span>
                {isOwner && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.green + '22', borderRadius: 6, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Check size={9} />Din profil
                  </span>
                )}
              </div>

              {/* Tier badge + BK Rating */}
              {allGames.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, padding: '3px 9px', borderRadius: 20,
                    background: tier.bg, border: `1px solid ${tier.border}`, color: tier.accent }}>
                    {tier.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tier.accent }}>BK Rating {rating}</span>
                  {formTrend && (
                    <span style={{ fontSize: 13, color: trendColor }}>{formTrend === 'up' ? '↑' : formTrend === 'down' ? '↓' : '→'}</span>
                  )}
                </div>
              )}

              {/* Team + location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 5, flexWrap: 'wrap' }}>
                {team && (
                  <a href={'/teams/' + team.id} style={{ fontSize: 14, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                    {shortName(team.name)}
                  </a>
                )}
                {player.hometown && (
                  <span style={{ fontSize: 13, color: C.textMuted, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={12} color={C.textMuted} />{player.hometown}
                  </span>
                )}
              </div>

              {/* Bio */}
              {player.bio && !editing && (
                <div style={{ marginTop: 10, fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>
                  {player.bio}
                </div>
              )}

              {/* Social links */}
              {(player.instagram || player.facebook || player.youtube) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {player.instagram && (
                    <a href={'https://instagram.com/' + player.instagram} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted, textDecoration: 'none' }}>
                      <ExternalLink size={12} />@{player.instagram}
                    </a>
                  )}
                  {player.facebook && (
                    <a href={player.facebook} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted, textDecoration: 'none' }}>
                      <ExternalLink size={12} />Facebook
                    </a>
                  )}
                  {player.youtube && (
                    <a href={player.youtube} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted, textDecoration: 'none' }}>
                      <ExternalLink size={12} />YouTube
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── Action buttons row ── */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 4 }}>
              <button onClick={() => setCardOpen(true)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 20, border: `1px solid ${tier.border}`,
                  background: tier.bg, color: tier.accent,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                🃏 Spelarkort
              </button>
              <button onClick={() => { setCompareOpen(true); setCompareQuery(''); setCompareResults([]) }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 20,
                  border: '1px solid rgba(245,194,0,0.30)', background: 'rgba(245,194,0,0.08)',
                  color: '#f5c200', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ⚔ H2H
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS BAR ─────────────────────────────────────────── */}
        {allGames.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', margin: '16px 0 0', borderTop: '1px solid ' + C.border, borderBottom: '1px solid ' + C.border }}>
            {[
              { label: 'SNITT',     value: avgScore,  color: '#f5c200' },
              { label: 'BÄSTA',     value: bestSeries, color: '#5a82b4' },
              { label: '200+',      value: over200,    color: tier.accent },
              { label: 'BK RATING', value: rating,     color: tier.accent },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: '14px 4px', textAlign: 'center',
                borderRight: i < 3 ? '1px solid ' + C.border : 'none',
                background: i === 3 ? tier.bg : 'transparent' }}>
                <div style={{ fontSize: i === 3 ? 20 : 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value || '—'}</div>
                <div style={{ fontSize: 8, color: C.textMuted, marginTop: 4, letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── TABS ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '1px solid ' + C.border, background: C.bg }}>
          {(['oversikt', 'matchlogg'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ flex: 1, padding: '12px 8px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
                color: activeTab === t ? '#f5c200' : C.textMuted,
                WebkitTapHighlightColor: 'transparent', position: 'relative' } as React.CSSProperties}>
              {activeTab === t && (
                <motion.div layoutId="player-tab-capsule" transition={SPRING}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#f5c200', borderRadius: 2 }} />
              )}
              {t === 'oversikt' ? 'Översikt' : 'Matchlogg'}
              {t === 'matchlogg' && results.length > 0 && (
                <span style={{ fontSize: 10, marginLeft: 5, opacity: 0.6 }}>({results.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── ÖVERSIKT TAB ──────────────────────────────────────── */}
        {activeTab === 'oversikt' && (
          <>
            {/* Form sparkline */}
            {allGames.length >= 3 && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2, marginBottom: 10 }}>SENASTE FORM</div>
                <Sparkline games={allGames} />
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#5a82b4' }} />250+
                  </span>
                  <span style={{ fontSize: 10, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#f5c200' }} />200+
                  </span>
                </div>
              </div>
            )}

            {/* Edit form */}
            {editing && (
              <div style={{ padding: '20px', borderBottom: '1px solid ' + C.border }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Redigera profil</div>
                {field('Om mig', 'bio', 'Skriv en kort beskrivning...', 'textarea')}
                {field('Hemstad', 'hometown', 'T.ex. Stockholm')}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>HAND</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['right', 'left'].map(h => (
                      <button key={h} onClick={() => setEditData(prev => ({ ...prev, hand: h }))}
                        style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid ' + (editData.hand === h ? C.accent : C.border),
                          background: editData.hand === h ? C.accent + '18' : 'transparent',
                          color: editData.hand === h ? C.accent : C.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {h === 'right' ? 'Höger' : 'Vänster'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>STIL</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Straight', 'Hook', 'Cranker', 'Tweener', 'Stroker'].map(s => (
                      <button key={s} onClick={() => setEditData(prev => ({ ...prev, style: s }))}
                        style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid ' + (editData.style === s ? C.accent : C.border),
                          background: editData.style === s ? C.accent + '18' : 'transparent',
                          color: editData.style === s ? C.accent : C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {field('Klotmärke', 'ball_brand', 'T.ex. Storm, Roto Grip...')}
                {field('Favoritcenter', 'favorite_center', 'T.ex. Nässjö Bowling')}
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, marginTop: 4 }}>SOCIALA MEDIER</div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>MERITER & TITLAR</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {(editData.achievements || []).map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.accent + '18', border: '1px solid ' + C.accent + '44', borderRadius: 20, padding: '4px 10px' }}>
                        <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{a}</span>
                        <button onClick={() => setEditData(prev => ({ ...prev, achievements: (prev.achievements || []).filter((_, j) => j !== i) }))}
                          style={{ background: 'transparent', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input id="achInput" placeholder='T.ex. "SM-guld 2024"'
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim()
                          if (val) { setEditData(prev => ({ ...prev, achievements: [...(prev.achievements || []), val] })); (e.target as HTMLInputElement).value = '' }
                        }
                      }}
                      style={{ flex: 1, background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none' }} />
                    <button onClick={() => {
                      const input = document.getElementById('achInput') as HTMLInputElement
                      const val = input?.value.trim()
                      if (val) { setEditData(prev => ({ ...prev, achievements: [...(prev.achievements || []), val] })); if (input) input.value = '' }
                    }} style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+</button>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>Tryck Enter eller + för att lägga till.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {['SM-guld', 'SM-silver', 'SM-brons', 'Landslagsspelare', 'PBA Tour', 'PWBA Tour', 'Weber Cup', '300-serie', 'Elitserien MVP'].map(preset => (
                      <button key={preset} onClick={() => setEditData(prev => ({
                        ...prev, achievements: (prev.achievements || []).includes(preset) ? prev.achievements : [...(prev.achievements || []), preset]
                      }))} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, background: 'transparent', border: '1px solid ' + C.border, color: C.textMuted, cursor: 'pointer' }}>
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
                {field('Instagram (användarnamn)', 'instagram', 'ditt_användarnamn')}
                {field('Facebook (URL)', 'facebook', 'https://facebook.com/...')}
                {field('YouTube (URL)', 'youtube', 'https://youtube.com/...')}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={save} disabled={saving}
                    style={{ flex: 1, background: C.accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Sparar...' : 'Spara'}
                  </button>
                  <button onClick={() => { setEditing(false); setEditData(player) }}
                    style={{ flex: 1, background: 'transparent', color: C.textMuted, border: '1px solid ' + C.border, borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Avbryt
                  </button>
                </div>
              </div>
            )}

            {/* Achievements */}
            {!editing && player.achievements && player.achievements.length > 0 && (
              <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + C.border }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2, marginBottom: 8 }}>MERITER</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {player.achievements.map((a, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, color: tier.accent, background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: 20, padding: '4px 10px' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Profile chips */}
            {!editing && (player.hand || player.style || player.ball_brand || player.favorite_center) && (
              <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + C.border, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {player.hand && (
                  <span style={{ fontSize: 12, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Hand size={11} />{player.hand === 'right' ? 'Högerhänt' : 'Vänsterhänt'}
                  </span>
                )}
                {player.style && (
                  <span style={{ fontSize: 12, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: '5px 12px' }}>
                    {player.style}
                  </span>
                )}
                {player.ball_brand && (
                  <span style={{ fontSize: 12, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: '5px 12px' }}>
                    🎳 {player.ball_brand}
                  </span>
                )}
                {player.favorite_center && (
                  <span style={{ fontSize: 12, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={11} />{player.favorite_center}
                  </span>
                )}
              </div>
            )}

            {/* Detailed stats row */}
            {allGames.length > 0 && (
              <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + C.border, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Matcher', value: results.length },
                  { label: '250+ spel', value: over250 },
                ].map(s => (
                  <div key={s.label} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            )}

            {allGames.length === 0 && !editing && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎳</div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 6 }}>Inga resultat ännu</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>Resultat registreras när matcher spelas.</div>
              </div>
            )}
          </>
        )}

        {/* ── MATCHLOGG TAB ─────────────────────────────────────── */}
        {activeTab === 'matchlogg' && (
          <div>
            {results.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: C.textMuted }}>Inga registrerade resultat ännu</div>
              </div>
            ) : (
              results.map(r => {
                const games = (r.games || []).filter((g: number) => g > 0)
                const total = games.reduce((a: number, b: number) => a + b, 0)
                const match = r.matches
                return (
                  <a key={r.id} href={'/matches/' + r.match_id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                        {match?.home?.name ? shortName(match.home.name) : ''} vs {match?.away?.name ? shortName(match.away.name) : ''}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                        {match?.date?.slice(0, 10) || ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {games.map((g: number, i: number) => (
                          <React.Fragment key={i}>
                            <span style={{
                              fontSize: g >= 250 ? 18 : g >= 200 ? 16 : 14,
                              fontWeight: g >= 250 ? 900 : g >= 200 ? 700 : 400,
                              color: g >= 250 ? '#ffffff' : g >= 200 ? '#5a82b4' : C.textMuted,
                              textShadow: g >= 250 ? '0 0 8px rgba(0,240,255,0.5)' : 'none',
                            }}>{g}</span>
                            {i < games.length - 1 && <span style={{ color: C.border, fontSize: 13 }}>|</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: total >= 800 ? '#5a82b4' : tier.accent }}>{total}</div>
                      <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2, letterSpacing: 0.5 }}>TOTALT</div>
                    </div>
                  </a>
                )
              })
            )}
          </div>
        )}

        {/* ── COMPARE SHEET ─────────────────────────────────────── */}
        {compareOpen && (
          <>
            <div onClick={() => setCompareOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={SPRING}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
                background: isDark ? '#131e2e' : '#ffffff',
                borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxWidth: 600, margin: '0 auto' }}>
              <div style={{ width: 36, height: 4, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>Head-to-Head</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
                Sök en spelare att jämföra med <span style={{ color: '#f5c200', fontWeight: 700 }}>{player.name.split(' ')[0]}</span>
              </div>
              <input autoFocus value={compareQuery} onChange={e => searchPlayers(e.target.value)}
                placeholder="Sök spelarnamn..."
                style={{ width: '100%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: '1px solid rgba(245,194,0,0.30)', borderRadius: 12, padding: '11px 14px',
                  color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }} />
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {searchingCompare && <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: C.textMuted }}>Söker...</div>}
                {!searchingCompare && compareQuery.length >= 2 && compareResults.length === 0 && (
                  <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: C.textMuted }}>Inga spelare hittades</div>
                )}
                {compareResults.map(op => (
                  <a key={op.id} href={`/compare/${id}/${op.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12,
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      textDecoration: 'none', border: '1px solid ' + C.border }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(245,194,0,0.12)',
                      border: '1px solid rgba(245,194,0,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#f5c200', flexShrink: 0 }}>
                      {op.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{op.name}</div>
                    <div style={{ marginLeft: 'auto', fontSize: 16, color: '#f5c200' }}>⚔</div>
                  </a>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* ── CARD DRAWER ───────────────────────────────────────── */}
        {cardOpen && (
          <>
            <div onClick={() => setCardOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
            <PlayerCard
              name={player.name}
              teamName={team ? shortName(team.name) : ''}
              avatarUrl={player.avatar_url}
              avg={avgScore || 180}
              bestSeries={bestSeries || 0}
              over200={over200}
              matches={results.length}
              division={team?.name ? (shortName(team.name).includes('Elit') ? 'Elitserien' : 'Allsvenskan') : 'Division'}
              hand={player.hand}
              style={player.style}
              ballBrand={player.ball_brand}
              bio={player.bio}
              achievements={player.achievements || []}
              isDark={isDark}
              isOwner={isOwner}
              onClose={() => setCardOpen(false)}
            />
          </>
        )}

      </div>
    </main>
  )
}
