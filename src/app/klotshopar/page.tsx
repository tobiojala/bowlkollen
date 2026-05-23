'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { MapPin, Phone, Smartphone, Mail, Globe, ExternalLink, Search, Award } from 'lucide-react'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

type Shop = {
  id: number
  name: string
  city: string | null
  street_address: string | null
  postal_code: string | null
  phone: string | null
  mobile: string | null
  email: string | null
  website: string | null
  ibpsia_certified: boolean
  accepts_gift_cards: boolean
}

function ContactRow({ icon: Icon, label, href, value }: {
  icon: React.ElementType
  label: string
  href?: string
  value: string
}) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light

  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'rgba(245,194,0,0.10)',
        border: '1px solid rgba(245,194,0,0.20)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={14} color="#f5c200" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: href ? '#f5c200' : C.text, marginTop: 2 }}>{value}</div>
      </div>
      {href && <ExternalLink size={12} color="#f5c200" style={{ marginLeft: 'auto' }} />}
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block', padding: '8px 0' }}
      >
        {content}
      </a>
    )
  }
  return <div style={{ padding: '8px 0' }}>{content}</div>
}

export default function KlotshoparPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    const db = createClient()
    db.from('pro_shops')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setShops((data as Shop[]) ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return shops
    return shops.filter(s =>
      s.name.toLowerCase().includes(q) || (s.city ?? '').toLowerCase().includes(q)
    )
  }, [shops, query])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 96 }}>
      {/* Header */}
      <div style={{
        padding: '56px 20px 16px',
        background: isDark
          ? 'linear-gradient(180deg, rgba(245,194,0,0.06) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(245,194,0,0.04) 0%, transparent 100%)',
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
          Klotshopar
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted }}>
          {loading ? 'Laddar...' : `${shops.length} pro shops i Sverige`}
        </p>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '10px 14px',
        }}>
          <Search size={16} color={C.textMuted} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök shop eller stad..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.text, fontSize: 15,
            }}
          />
        </div>
      </div>

      {/* Shop cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} style={{
              height: 100, borderRadius: 16,
              background: C.card, border: `1px solid ${C.border}`,
              opacity: 0.5,
            }} />
          ))
        ) : filtered.map((shop, i) => {
          const isOpen = expanded === shop.id
          const address = [shop.street_address, shop.postal_code && shop.city ? `${shop.postal_code} ${shop.city}` : shop.city].filter(Boolean).join(', ')
          const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null

          return (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: Math.min(i * 0.04, 0.3) }}
              style={{
                background: C.card,
                border: isOpen ? '1px solid rgba(245,194,0,0.35)' : `1px solid ${C.border}`,
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: isOpen ? '0 0 20px rgba(245,194,0,0.08)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Card header — tap to expand */}
              <div
                onClick={() => setExpanded(isOpen ? null : shop.id)}
                style={{ padding: '16px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{shop.name}</span>
                      {shop.ibpsia_certified && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 7px', borderRadius: 8,
                          background: 'rgba(245,194,0,0.12)',
                          border: '1px solid rgba(245,194,0,0.30)',
                          color: '#f5c200',
                        }}>
                          <Award size={9} /> IBPSIA
                        </span>
                      )}
                    </div>
                    {shop.city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, color: C.textMuted, fontSize: 13 }}>
                        <MapPin size={12} />
                        {shop.city}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                      {shop.accepts_gift_cards && (
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 10,
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                          color: C.textMuted,
                        }}>
                          Presentkort
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={SPRING}
                    style={{ color: C.textMuted, fontSize: 20, lineHeight: 1, marginLeft: 8, marginTop: 2 }}
                  >
                    ›
                  </motion.div>
                </div>
              </div>

              {/* Expanded details */}
              <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: '0 16px 16px',
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 12,
                }}>
                  {address && (
                    <ContactRow icon={MapPin} label="Adress" value={address} href={mapsUrl ?? undefined} />
                  )}
                  {shop.phone && (
                    <ContactRow icon={Phone} label="Telefon" value={shop.phone} href={`tel:${shop.phone}`} />
                  )}
                  {shop.mobile && (
                    <ContactRow icon={Smartphone} label="Mobil" value={shop.mobile} href={`tel:${shop.mobile}`} />
                  )}
                  {shop.email && (
                    <ContactRow icon={Mail} label="E-post" value={shop.email} href={`mailto:${shop.email}`} />
                  )}
                  {shop.website && (
                    <ContactRow icon={Globe} label="Hemsida" value="Öppna webbplats" href={shop.website} />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: C.textMuted, padding: '48px 0', fontSize: 14 }}>
            Inga klotshopar hittades
          </div>
        )}
      </div>
    </div>
  )
}
