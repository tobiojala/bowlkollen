'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { ArrowLeft, MapPin, Phone, Mail, Globe, ExternalLink, CalendarCheck, Monitor } from 'lucide-react'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

type Hall = {
  id: number
  name: string
  city: string | null
  street_address: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  region: string | null
  lanes: number | null
  machine_type: string | null
  lane_type: string | null
  oil_machine: string | null
  online_scoring: boolean
  online_scoring_url: string | null
  online_booking: boolean
  online_booking_url: string | null
  accepts_gift_cards: boolean
  inspection_status: string | null
  inspection_date: string | null
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 13, color: C.textMuted }}>{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 14, fontWeight: 500, color: '#f5c200', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {value} <ExternalLink size={12} />
        </a>
      ) : (
        <span style={{ fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
      )}
    </div>
  )
}

export default function HallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = createClient()
    db.from('bowling_centers')
      .select('*')
      .eq('id', parseInt(id))
      .single()
      .then(({ data }) => {
        setHall(data as Hall)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: 14 }}>Laddar...</div>
      </div>
    )
  }

  if (!hall) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: 14 }}>Hallen hittades inte</div>
      </div>
    )
  }

  const address = [hall.street_address, hall.postal_code && hall.city ? `${hall.postal_code} ${hall.city}` : hall.city].filter(Boolean).join(', ')
  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 48 }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        padding: '0 0 24px',
        background: isDark
          ? 'linear-gradient(160deg, rgba(245,194,0,0.10) 0%, #0B1528 60%)'
          : 'linear-gradient(160deg, rgba(245,194,0,0.07) 0%, #f5f2ec 60%)',
      }}>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 52, left: 16,
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
            border: 'none', borderRadius: 20,
            padding: '8px 14px 8px 10px',
            display: 'flex', alignItems: 'center', gap: 6,
            color: C.text, fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ArrowLeft size={16} /> Tillbaka
        </button>

        <div style={{ padding: '108px 20px 0' }}>
          {/* Region pill */}
          {hall.region && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'inline-block',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.6px',
                textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(245,194,0,0.10)',
                border: '1px solid rgba(245,194,0,0.30)',
                color: '#f5c200',
                marginBottom: 10,
              }}
            >
              {hall.region}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{ fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: '-0.5px' }}
          >
            {hall.name}
          </motion.h1>

          {hall.city && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, color: C.textMuted, fontSize: 14 }}
            >
              <MapPin size={13} />
              {hall.city}
            </motion.div>
          )}

          {/* Stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}
          >
            {hall.lanes && (
              <div style={{
                padding: '8px 14px', borderRadius: 12,
                background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${C.border}`,
                fontSize: 13, fontWeight: 700,
              }}>
                {hall.lanes} banor
              </div>
            )}
            {hall.online_booking && (
              <a
                href={hall.online_booking_url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 14px', borderRadius: 12, textDecoration: 'none',
                  background: 'rgba(56,160,136,0.13)',
                  border: '1px solid rgba(56,160,136,0.30)',
                  fontSize: 13, fontWeight: 700, color: '#38a088',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <CalendarCheck size={13} /> Online-bokning
              </a>
            )}
            {hall.online_scoring && (
              <a
                href={hall.online_scoring_url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 14px', borderRadius: 12, textDecoration: 'none',
                  background: 'rgba(245,194,0,0.11)',
                  border: '1px solid rgba(245,194,0,0.30)',
                  fontSize: 13, fontWeight: 700, color: '#f5c200',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Monitor size={13} /> Online-scoring
              </a>
            )}
            {hall.accepts_gift_cards && (
              <div style={{
                padding: '8px 14px', borderRadius: 12,
                background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${C.border}`,
                fontSize: 13, fontWeight: 700,
              }}>
                Presentkort
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content sections */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.18 }}
          style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 18, padding: '4px 16px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.6px', textTransform: 'uppercase', paddingTop: 14, paddingBottom: 4 }}>
            Kontakt
          </div>
          {address && <InfoRow label="Adress" value={address} href={mapsUrl ?? undefined} />}
          {hall.phone && <InfoRow label="Telefon" value={hall.phone} href={`tel:${hall.phone}`} />}
          {hall.email && <InfoRow label="E-post" value={hall.email} href={`mailto:${hall.email}`} />}
          {hall.website && <InfoRow label="Hemsida" value="Öppna" href={hall.website} />}
        </motion.div>

        {/* Technical */}
        {(hall.machine_type || hall.lane_type || hall.oil_machine) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.24 }}
            style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 18, padding: '4px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.6px', textTransform: 'uppercase', paddingTop: 14, paddingBottom: 4 }}>
              Teknisk info
            </div>
            {hall.machine_type && <InfoRow label="Maskintyp" value={hall.machine_type} />}
            {hall.lane_type && <InfoRow label="Bantyp" value={hall.lane_type} />}
            {hall.oil_machine && <InfoRow label="Oljemaskinstyp" value={hall.oil_machine} />}
          </motion.div>
        )}

        {/* Inspection */}
        {(hall.inspection_status || hall.inspection_date) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.30 }}
            style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 18, padding: '4px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.6px', textTransform: 'uppercase', paddingTop: 14, paddingBottom: 4 }}>
              Besiktning
            </div>
            {hall.inspection_status && <InfoRow label="Status" value={hall.inspection_status} />}
            {hall.inspection_date && <InfoRow label="Datum" value={hall.inspection_date} />}
          </motion.div>
        )}
      </div>
    </div>
  )
}
