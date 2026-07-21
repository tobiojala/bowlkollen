'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import type { Sponsor, SponsorTier } from '@/lib/types'

const TIERS: { value: SponsorTier; label: string }[] = [
  { value: 'main',    label: 'Huvudsponsor' },
  { value: 'gold',    label: 'Guld'         },
  { value: 'silver',  label: 'Silver'       },
  { value: 'partner', label: 'Partner'      },
]

const BLANK = { name: '', logo_url: '', website: '', tagline: '', tier: 'gold' as SponsorTier }

type Props = { teamId: string }

export default function TeamSponsorAdmin({ teamId }: Props) {
  const { C, isDark } = useColors()
  const [sponsors,          setSponsors]          = useState<Sponsor[]>([])
  const [acceptingSponsors, setAcceptingSponsors] = useState(false)
  const [form,              setForm]              = useState(BLANK)
  const [adding,            setAdding]            = useState(false)

  const bg    = isDark ? '#0d1a2e' : '#f0f4f8'
  const rowBg = isDark ? 'rgba(255,255,255,0.04)' : '#fff'

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('team_sponsors').select('*').eq('team_id', teamId).order('display_order'),
      supabase.from('teams').select('accepting_sponsors').eq('id', teamId).single(),
    ]).then(([{ data: s }, { data: t }]) => {
      if (s) setSponsors(s as Sponsor[])
      if (t) setAcceptingSponsors(t.accepting_sponsors ?? false)
    })
  }, [teamId])

  const toggleAccepting = async () => {
    const next = !acceptingSponsors
    setAcceptingSponsors(next)
    await createClient().from('teams').update({ accepting_sponsors: next }).eq('id', teamId)
  }

  const addSponsor = async () => {
    if (!form.name.trim()) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('team_sponsors')
      .insert({
        team_id:       teamId,
        name:          form.name.trim(),
        logo_url:      form.logo_url.trim()  || null,
        website:       form.website.trim()   || null,
        tagline:       form.tagline.trim()   || null,
        tier:          form.tier,
        display_order: sponsors.filter(s => s.tier === form.tier).length,
      })
      .select('*')
      .single()
    if (!error && data) {
      setSponsors(prev => [...prev, data as Sponsor])
      setForm(BLANK)
      setAdding(false)
    }
  }

  const removeSponsor = async (id: string) => {
    await createClient().from('team_sponsors').delete().eq('id', id)
    setSponsors(prev => prev.filter(s => s.id !== id))
  }

  const Field = ({ label, field, placeholder }: { label: string; field: keyof typeof BLANK; placeholder: string }) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <input value={form[field] as string} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
        style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties} />
    </div>
  )

  return (
    <div style={{ background: bg, borderBottom: '1px solid ' + C.border, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, letterSpacing: 1 }}>SPONSORER</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <div onClick={toggleAccepting}
            style={{ width: 36, height: 20, borderRadius: 10, background: acceptingSponsors ? C.accent : C.border, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 } as React.CSSProperties}>
            <div style={{ position: 'absolute', top: 2, left: acceptingSponsors ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: acceptingSponsors ? '#1a1400' : C.muted, transition: 'left 0.2s' } as React.CSSProperties} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Söker sponsorer</span>
        </label>
      </div>

      {sponsors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {sponsors.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: rowBg, border: '1px solid ' + C.border, borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{TIERS.find(t => t.value === s.tier)?.label}</div>
              </div>
              <button onClick={() => removeSponsor(s.id)} style={{ background: 'transparent', border: 'none', color: '#e05555', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: rowBg, border: '1px solid ' + C.border, borderRadius: 12, padding: '14px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="NAMN *" field="name" placeholder="Sponsorns namn" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 4 }}>NIVÅ</div>
              <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value as SponsorTier }))}
                style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties}>
                {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <Field label="WEBBPLATS"  field="website"  placeholder="https://..." />
          <Field label="LOGO-URL"   field="logo_url" placeholder="https://..." />
          <Field label="TAGLINE"    field="tagline"  placeholder='"Official partner since 2024"' />
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <button onClick={addSponsor} disabled={!form.name.trim()}
              style={{ flex: 1, background: form.name.trim() ? C.accent : C.border, color: form.name.trim() ? '#1a1400' : C.muted, border: 'none', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 700, cursor: form.name.trim() ? 'pointer' : 'default' }}>
              Lägg till
            </button>
            <button onClick={() => { setAdding(false); setForm(BLANK) }}
              style={{ flex: 1, background: 'transparent', color: C.muted, border: '1px solid ' + C.border, borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: C.accent, border: '1px dashed ' + C.accent + '66', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Lägg till sponsor
        </button>
      )}
    </div>
  )
}
