'use client'

import { motion } from 'framer-motion'
import { useColors } from '@/components/ThemeProvider'
import { MapPin, ShoppingBag, Droplets } from 'lucide-react'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

const ITEMS = [
  {
    href: '/hallar',
    icon: MapPin,
    label: 'Bowlinghallar',
    sub: '174 hallar i Sverige',
    description: 'Hitta närmaste bowlinghall, öppettider, banor och bokningslänkar.',
  },
  {
    href: '/klotshopar',
    icon: ShoppingBag,
    label: 'Klotshopar',
    sub: '16 pro shops',
    description: 'Hitta pro shops med IBPSIA-certifierade tekniker.',
  },
  {
    href: '/oljeprofiler',
    icon: Droplets,
    label: 'Oljeprofiler',
    sub: 'Säsong 2025/2026',
    description: 'Svenska Bowlingförbundets godkända oljeprofiler för alla divisioner.',
  },
]

export default function MerPage() {
  const { C, isDark } = useColors()

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 96 }}>
      <div style={{ padding: '20px 20px 16px' }}>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>Utforska</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 16px' }}>
        {ITEMS.map(({ href, icon: Icon, label, sub, description }, i) => (
          <motion.a
            key={href}
            href={href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: i * 0.07 }}
            whileTap={{ scale: 0.97 }}
            style={{
              textDecoration: 'none',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: '18px 16px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'rgba(245,194,0,0.10)',
              border: '1px solid rgba(245,194,0,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={22} color="#f5c200" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{label}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{sub}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 1.4 }}>{description}</div>
            </div>
            <div style={{ color: C.textMuted, fontSize: 22, flexShrink: 0 }}>›</div>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
