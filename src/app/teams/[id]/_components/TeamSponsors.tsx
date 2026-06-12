'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ExternalLink, Star } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import type { Sponsor, SponsorTier } from '@/lib/types'

const TIER_META: Record<SponsorTier, { label: string; accentLight: string; accentDark: string }> = {
  main:    { label: 'Huvudsponsor',   accentLight: '#b8860b', accentDark: '#f5c200' },
  gold:    { label: 'Guldsponsorer',  accentLight: '#b8860b', accentDark: '#f5c200' },
  silver:  { label: 'Silverpartners', accentLight: '#607080', accentDark: '#9eb8cc' },
  partner: { label: 'Partners',       accentLight: '#444',    accentDark: '#999'    },
}

const DEFAULT_BENEFITS: Record<SponsorTier, string[]> = {
  main:    ['Logo på lagsidan – framträdande plats', 'Länk till er webbplats', 'Tagline synlig för alla besökare', 'Omnämns i lagkommunikation'],
  gold:    ['Logo på lagsidan – stor', 'Länk till er webbplats'],
  silver:  ['Logo på lagsidan – medium', 'Länk till er webbplats'],
  partner: ['Logo på lagsidan'],
}

type Props = {
  teamId: string
  teamName: string
  contactEmail: string | null
}

export default function TeamSponsors({ teamId, teamName, contactEmail }: Props) {
  const { C, isDark } = useColors()
  const [sponsors,          setSponsors]          = useState<Sponsor[]>([])
  const [acceptingSponsors, setAcceptingSponsors] = useState(false)
  const [failedLogos,       setFailedLogos]       = useState<Set<string>>(new Set())

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

  const byTier = (t: SponsorTier) => sponsors.filter(s => s.tier === t).sort((a, b) => a.display_order - b.display_order)
  const main    = byTier('main')
  const gold    = byTier('gold')
  const silver  = byTier('silver')
  const partner = byTier('partner')

  const hasAny  = sponsors.length > 0
  const visible = hasAny || acceptingSponsors
  if (!visible) return null

  const accent = (t: SponsorTier) => isDark ? TIER_META[t].accentDark : TIER_META[t].accentLight

  const LogoBox = ({ s, size }: { s: Sponsor; size: number }) => (
    <div style={{ width: size, height: size, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : '#fff', border: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {s.logo_url && !failedLogos.has(s.id)
        ? <Image src={s.logo_url} alt={s.name} width={size} height={size} onError={() => setFailedLogos(prev => new Set([...prev, s.id]))} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: size * 0.12 }} />
        : <span style={{ fontSize: size * 0.28, fontWeight: 800, color: C.muted }}>{s.name[0]}</span>}
    </div>
  )

  return (
    <section id="team-sponsors" style={{ scrollMarginTop: 60, borderTop: '1px solid ' + C.border }}>
      <div style={{ padding: '20px 20px 4px' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>SPONSORER</span>
      </div>

      {/* Main sponsor */}
      {main.map(s => (
        <div key={s.id} style={{ margin: '12px 20px', background: isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.08)', border: '1px solid ' + accent('main') + '44', borderRadius: 20, padding: '20px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Star size={11} color={accent('main')} fill={accent('main')} />
            <span style={{ fontSize: 10, fontWeight: 800, color: accent('main'), letterSpacing: 1.5 }}>HUVUDSPONSOR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LogoBox s={s} size={80} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: s.tagline ? 4 : 8 }}>{s.name}</div>
              {s.tagline && <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic', marginBottom: 10 }}>"{s.tagline}"</div>}
              {s.website && (
                <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: accent('main'), textDecoration: 'none', background: accent('main') + '18', border: '1px solid ' + accent('main') + '44', borderRadius: 20, padding: '5px 12px' }}>
                  <ExternalLink size={11} /> Besök webbplats
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Gold sponsors */}
      {gold.length > 0 && (
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent('gold'), letterSpacing: 1.5, marginBottom: 10 }}>GULDSPONSORER</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {gold.map(s => (
              <a key={s.id} href={s.website ?? undefined} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: '16px 12px', textDecoration: 'none', cursor: s.website ? 'pointer' : 'default' }}>
                <LogoBox s={s} size={64} />
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, textAlign: 'center' }}>{s.name}</div>
                {s.website && <div style={{ fontSize: 10, color: accent('gold'), display: 'flex', alignItems: 'center', gap: 3 }}><ExternalLink size={9} />webb</div>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Silver sponsors */}
      {silver.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent('silver'), letterSpacing: 1.5, marginBottom: 10 }}>SILVERPARTNERS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {silver.map(s => (
              <a key={s.id} href={s.website ?? undefined} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '12px 8px', textDecoration: 'none', cursor: s.website ? 'pointer' : 'default' }}>
                <LogoBox s={s} size={48} />
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, textAlign: 'center', lineHeight: 1.2 }}>{s.name}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Partners (logo wall) */}
      {partner.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, marginBottom: 10 }}>PARTNERS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {partner.map(s => (
              <a key={s.id} href={s.website ?? undefined} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '8px 12px', textDecoration: 'none' }}>
                <LogoBox s={s} size={28} />
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{s.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* "Bli sponsor" pitch */}
      {acceptingSponsors && (
        <div style={{ margin: '20px 20px 0', background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: '20px', overflow: 'hidden' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 4 }}>Bli vår sponsor</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
            {teamName} söker partners. Syns bland hundratals bowlingfans — välj det paket som passar er bäst.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {(['gold', 'silver', 'partner'] as SponsorTier[]).map(t => (
              <div key={t} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '12px 10px', border: '1px solid ' + C.border }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: accent(t), letterSpacing: 1, marginBottom: 8 }}>{TIER_META[t].label.toUpperCase().split('SPONSORER')[0].split('PARTNERS')[0]}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {DEFAULT_BENEFITS[t].map((b, i) => (
                    <li key={i} style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>✓ {b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}?subject=Sponsorförfrågan – ${teamName}&body=Hej! Jag är intresserad av att bli sponsor för ${teamName}. Vänligen kontakta mig för mer information.`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.accent, color: '#1a1400', borderRadius: 20, padding: '10px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
            >
              Kontakta oss om sponsorskap →
            </a>
          )}
          {!contactEmail && (
            <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Lägg till kontakt-email på lagsidan för att aktivera sponsor-knappen.</div>
          )}
        </div>
      )}

      <div style={{ height: 24 }} />
    </section>
  )
}
