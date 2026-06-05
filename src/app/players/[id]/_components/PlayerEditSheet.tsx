'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Player = {
  id: string; bio: string | null; hand: string | null; style: string | null
  hometown: string | null; ball_brand: string | null
  instagram: string | null; facebook: string | null; youtube: string | null
  favorite_center: string | null; achievements: string[] | null
}

export default function PlayerEditSheet({ player, onSave, onClose, isDark }: {
  player: Player
  onSave: (updated: Partial<Player>) => void
  onClose: () => void
  isDark: boolean
}) {
  const [data, setData] = useState<Partial<Player>>({ ...player })
  const [saving, setSaving] = useState(false)
  const [newAch, setNewAch] = useState('')

  const BG     = isDark ? '#172030' : '#fff'
  const BORDER = isDark ? '#2a3858' : '#e8e0d4'
  const MUTED  = isDark ? '#6b7a99' : '#6b7a8d'
  const TEXT   = isDark ? '#fff'    : '#1a2535'
  const GOLD   = '#f5c200'

  const set = <K extends keyof Player>(k: K, v: Player[K]) => setData(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').update({
      bio: data.bio, hand: data.hand, style: data.style,
      hometown: data.hometown, ball_brand: data.ball_brand,
      instagram: data.instagram, facebook: data.facebook, youtube: data.youtube,
      favorite_center: data.favorite_center, achievements: data.achievements,
    }).eq('id', player.id)
    if (!error) { onSave(data); onClose() }
    setSaving(false)
  }

  const inp = (s: React.CSSProperties = {}): React.CSSProperties => ({
    width: '100%', background: isDark ? '#1c2840' : '#f5f2ec',
    border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 12px',
    color: TEXT, fontSize: 13, outline: 'none', fontFamily: 'system-ui',
    boxSizing: 'border-box', ...s,
  })

  const label = (t: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 0.5, marginBottom: 6 }}>
      {t.toUpperCase()}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column',
      background: isDark ? 'rgba(11,18,32,0.88)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div style={{ marginTop: 'auto', background: BG, borderRadius: '20px 20px 0 0',
        maxHeight: '90dvh', overflowY: 'auto', padding: '20px 20px 40px' }}
        onClick={e => e.stopPropagation()}>

        {/* Handle + title */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: MUTED, margin: '0 auto 20px', opacity: 0.4 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Redigera profil</span>
          <button onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: MUTED }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Bio */}
          <div>
            {label('Om mig')}
            <textarea value={data.bio || ''} onChange={e => set('bio', e.target.value)}
              placeholder="Skriv en kort beskrivning..." rows={3} style={inp({ resize: 'vertical' })} />
          </div>

          {/* Hometown */}
          <div>
            {label('Hemstad')}
            <input value={data.hometown || ''} onChange={e => set('hometown', e.target.value)}
              placeholder="T.ex. Stockholm" style={inp()} />
          </div>

          {/* Hand */}
          <div>
            {label('Hand')}
            <div style={{ display: 'flex', gap: 8 }}>
              {['right', 'left'].map(h => (
                <button key={h} onClick={() => set('hand', h)}
                  style={{ flex: 1, padding: '9px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${data.hand === h ? GOLD : BORDER}`,
                    background: data.hand === h ? GOLD + '18' : 'transparent',
                    color: data.hand === h ? GOLD : MUTED, fontSize: 13, fontWeight: 600 }}>
                  {h === 'right' ? 'Höger' : 'Vänster'}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            {label('Stil')}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Straight', 'Hook', 'Cranker', 'Tweener', 'Stroker'].map(s => (
                <button key={s} onClick={() => set('style', s)}
                  style={{ padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                    border: `1px solid ${data.style === s ? GOLD : BORDER}`,
                    background: data.style === s ? GOLD + '18' : 'transparent',
                    color: data.style === s ? GOLD : MUTED, fontSize: 12, fontWeight: 600 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Ball brand + fav center */}
          <div>
            {label('Klotmärke')}
            <input value={data.ball_brand || ''} onChange={e => set('ball_brand', e.target.value)}
              placeholder="T.ex. Storm, Roto Grip..." style={inp()} />
          </div>
          <div>
            {label('Favoritcenter')}
            <input value={data.favorite_center || ''} onChange={e => set('favorite_center', e.target.value)}
              placeholder="T.ex. Nässjö Bowling" style={inp()} />
          </div>

          {/* Social */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {label('Sociala medier')}
            {[['instagram', '@användarnamn'], ['facebook', 'Profil-URL'], ['youtube', 'Kanal-URL']].map(([key, ph]) => (
              <input key={key} value={(data as any)[key] || ''} onChange={e => set(key as any, e.target.value)}
                placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)}: ${ph}`} style={inp()} />
            ))}
          </div>

          {/* Achievements */}
          <div>
            {label('Meriter & Titlar')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {(data.achievements || []).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4,
                  background: GOLD + '18', border: `1px solid ${GOLD}44`, borderRadius: 20, padding: '4px 10px' }}>
                  <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>{a}</span>
                  <button onClick={() => set('achievements', (data.achievements || []).filter((_, j) => j !== i))}
                    style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newAch} onChange={e => setNewAch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newAch.trim()) {
                    set('achievements', [...(data.achievements || []), newAch.trim()])
                    setNewAch('')
                  }
                }}
                placeholder='T.ex. "SM-guld 2024"' style={inp({ flex: '1' as any })} />
              <button onClick={() => {
                if (newAch.trim()) { set('achievements', [...(data.achievements || []), newAch.trim()]); setNewAch('') }
              }}
                style={{ padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: GOLD + '22', color: GOLD, fontSize: 13, fontWeight: 700 }}>+</button>
            </div>
          </div>

          {/* Save */}
          <button onClick={save} disabled={saving}
            style={{ marginTop: 8, padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: GOLD, color: '#1a1400', fontSize: 15, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {saving ? 'Sparar...' : 'Spara profil'}
          </button>
        </div>
      </div>
    </div>
  )
}
