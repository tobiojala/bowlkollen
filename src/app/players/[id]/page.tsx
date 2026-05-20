'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import PlayerCard from '@/components/PlayerCard'

type Props = { params: Promise<{ id: string }> }

type Player = {
  id: string; name: string; team_id: string | null
  bio: string | null; hand: string | null; style: string | null
  hometown: string | null; ball_brand: string | null; avatar_url: string | null
  instagram: string | null; facebook: string | null; youtube: string | null
  favorite_center: string | null
}

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

export default function PlayerPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [id, setId] = useState<string | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Player>>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)

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

      // Check if logged in user owns this profile
      if (session) {
        const { data: claim } = await supabase
          .from('player_claims')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('player_id', id)
          .single()
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
      bio: editData.bio,
      hand: editData.hand,
      style: editData.style,
      hometown: editData.hometown,
      ball_brand: editData.ball_brand,
      instagram: editData.instagram,
      facebook: editData.facebook,
      youtube: editData.youtube,
      favorite_center: editData.favorite_center,
    }).eq('id', id)

    if (!error) {
      setPlayer(prev => prev ? { ...prev, ...editData } : null)
      setEditing(false)
    }
    setSaving(false)
  }

  const uploadAvatar = async (file: File) => {
    if (!id) return
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = 'avatars/' + id + '.' + ext

    const { error: uploadError } = await supabase.storage
      .from('player-avatars')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('player-avatars')
        .getPublicUrl(path)

      await supabase.from('players').update({ avatar_url: publicUrl }).eq('id', id)
      setPlayer(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
    }
    setUploadingAvatar(false)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  if (!player) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Spelare hittades inte</div>
    </main>
  )

  const hue = player.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,45%)'
  const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

  // Stats
  const allGames = results.flatMap(r => (r.games || []).filter((g: number) => g > 0))
  const avgScore = allGames.length > 0 ? Math.round(allGames.reduce((a: number, b: number) => a + b, 0) / allGames.length) : null
  const seriesTotals = results.map(r => (r.games || []).filter((g: number) => g > 0).reduce((a: number, b: number) => a + b, 0)).filter((t: number) => t > 0)
  const bestSeries = seriesTotals.length > 0 ? Math.max(...seriesTotals) : null
  const over200 = allGames.filter((g: number) => g >= 200).length
  const over250 = allGames.filter((g: number) => g >= 250).length

  const field = (label: string, key: keyof Player, placeholder: string, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>{label.toUpperCase()}</div>
      {editing ? (
        type === 'textarea' ? (
          <textarea value={(editData[key] as string) || ''} onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder} rows={3}
            style={{ width: '100%', background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' as const }} />
        ) : (
          <input value={(editData[key] as string) || ''} onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{ width: '100%', background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 48px' }}>

        {/* Hero */}
        <div style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #0d1a2e 0%, #1a2840 100%)' : 'linear-gradient(135deg, #e8f0f8 0%, #d0e0f0 100%)', padding: '24px 20px 20px' }}>
          <a href="/players" style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
            ← Alla spelare
          </a>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={player.name} style={{ width: 72, height: 72, borderRadius: '50%', border: '2.5px solid ' + tc, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: tclo, border: '2.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: tc }}>
                  {player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              {isOwner && (
                <label style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}>
                  {uploadingAvatar ? '⏳' : '📷'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                </label>
              )}
            </div>

            {/* Name + team */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{player.name}</div>
                {isOwner && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.green + '22', borderRadius: 6, padding: '2px 6px' }}>✓ Din profil</span>
                )}
              </div>
              {team && (
                <a href={'/teams/' + team.id} style={{ fontSize: 13, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                  {shortName(team.name)}
                </a>
              )}
              {player.hometown && (
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>📍 {player.hometown}</div>
              )}
              {/* Social links */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {player.instagram && (
                  <a href={'https://instagram.com/' + player.instagram} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none', background: C.card, border: '1px solid ' + C.border, borderRadius: 6, padding: '3px 8px' }}>
                    📸 @{player.instagram}
                  </a>
                )}
                {player.facebook && (
                  <a href={player.facebook} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none', background: C.card, border: '1px solid ' + C.border, borderRadius: 6, padding: '3px 8px' }}>
                    Facebook
                  </a>
                )}
                {player.youtube && (
                  <a href={player.youtube} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none', background: C.card, border: '1px solid ' + C.border, borderRadius: 6, padding: '3px 8px' }}>
                    YouTube
                  </a>
                )}
              </div>
            </div>

            {/* Edit button */}
            {isOwner && !editing && (
              <button onClick={() => setEditing(true)}
                style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: C.textMuted, cursor: 'pointer', flexShrink: 0 }}>
                Redigera
              </button>
            )}
          </div>

          {/* Bio */}
          {player.bio && !editing && (
            <div style={{ marginTop: 14, fontSize: 13, color: C.textMuted, lineHeight: 1.5, fontStyle: 'italic' }}>
              "{player.bio}"
            </div>
          )}
        </div>

        {/* Stats */}
        {results.length > 0 && (
          <div style={{ borderBottom: '1px solid ' + C.border }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid ' + C.border }}>
              {[
                { label: 'Snitt', value: avgScore || '—', color: C.accent },
                { label: 'Basta serie', value: bestSeries || '—', color: C.green },
                { label: '200+', value: over200, color: tc },
                { label: '250+', value: over250, color: '#f5c200' },
              ].map((s, i) => (
                <div key={s.label} style={{ padding: '14px 8px', textAlign: 'center', borderRight: i < 3 ? '1px solid ' + C.border : 'none' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{ padding: '20px 20px', borderBottom: '1px solid ' + C.border }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Redigera profil</div>
            {field('Om mig', 'bio', 'Skriv en kort beskrivning...', 'textarea')}
            {field('Hemstad', 'hometown', 'T.ex. Stockholm')}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>HAND</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['right', 'left'].map(h => (
                  <button key={h} onClick={() => setEditData(prev => ({ ...prev, hand: h }))}
                    style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid ' + (editData.hand === h ? C.accent : C.border), background: editData.hand === h ? C.accent + '18' : 'transparent', color: editData.hand === h ? C.accent : C.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {h === 'right' ? '👉 Hoger' : '👈 Vanster'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>STIL</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {['Straight', 'Hook', 'Cranker', 'Tweener', 'Stroker'].map(s => (
                  <button key={s} onClick={() => setEditData(prev => ({ ...prev, style: s }))}
                    style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid ' + (editData.style === s ? C.accent : C.border), background: editData.style === s ? C.accent + '18' : 'transparent', color: editData.style === s ? C.accent : C.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {field('Klotmarke', 'ball_brand', 'T.ex. Storm, Roto Grip...')}
            {field('Favoritcenter', 'favorite_center', 'T.ex. Nässjö Bowling')}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, marginTop: 4 }}>SOCIALA MEDIER</div>
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

        {/* Profile details (non-editing) */}
        {!editing && (player.hand || player.style || player.ball_brand || player.favorite_center) && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border, display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {player.hand && (
              <span style={{ fontSize: 12, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '4px 10px' }}>
                {player.hand === 'right' ? '👉 Hogerhänt' : '👈 Vänsterhänt'}
              </span>
            )}
            {player.style && (
              <span style={{ fontSize: 12, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '4px 10px' }}>
                🎳 {player.style}
              </span>
            )}
            {player.ball_brand && (
              <span style={{ fontSize: 12, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '4px 10px' }}>
                🔵 {player.ball_brand}
              </span>
            )}
            {player.favorite_center && (
              <span style={{ fontSize: 12, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '4px 10px' }}>
                📍 {player.favorite_center}
              </span>
            )}
          </div>
        )}

        {/* Spelarkort button */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid ' + C.border }}>
          <button onClick={() => setCardOpen(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: C.card, border: '1px solid ' + C.border, borderRadius: 14, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 20 }}>🃏</div>
              <div style={{ textAlign: 'left' as const }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Visa spelarkort</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                  {isOwner ? 'Se, dela och ladda ner ditt kort' : 'Se spelarkortet'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 16, color: C.textMuted }}>›</div>
          </button>
        </div>

        {/* Card drawer */}
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
              achievements={[]}
              isDark={theme === 'dark'}
              isOwner={isOwner}
              onClose={() => setCardOpen(false)}
            />
          </>
        )}

        {/* Match history */}
        {results.length > 0 && (
          <div>
            <div style={{ padding: '14px 20px 8px', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>
              MATCHHISTORIK
            </div>
            {results.map(r => {
              const games = r.games || []
              const total = games.filter((g: number) => g > 0).reduce((a: number, b: number) => a + b, 0)
              const match = r.matches
              return (
                <a key={r.id} href={'/matches/' + r.match_id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                      {match?.home?.name ? shortName(match.home.name) : ''} vs {match?.away?.name ? shortName(match.away.name) : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {games.filter((g: number) => g > 0).map((g: number, i: number) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: g >= 200 ? 700 : 400, color: g >= 250 ? '#f5c200' : g >= 200 ? C.green : C.textMuted }}>
                          {g}{i < games.filter((g: number) => g > 0).length - 1 ? ' ·' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: total >= 800 ? C.green : C.accent }}>{total}</div>
                    <div style={{ fontSize: 9, color: C.textMuted }}>TOTALT</div>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {results.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.textMuted }}>Inga registrerade resultat ännu</div>
          </div>
        )}

      </div>
    </main>
  )
}
