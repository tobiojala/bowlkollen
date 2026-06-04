'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import {
  MapPin, Phone, Smartphone, Mail, Globe, ExternalLink, Search, Award,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

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

function ContactRow({
  icon: Icon,
  label,
  href,
  value,
}: {
  icon: LucideIcon
  label: string
  href?: string
  value: string
}) {
  const content = (
    <div className="flex items-center gap-2.5 py-2">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]',
          'border border-gold/20 bg-gold/10',
        )}
      >
        <Icon size={14} className="text-gold" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] leading-none text-dark-muted">{label}</div>
        <div className={cn('mt-0.5 text-[13px] font-semibold', href ? 'text-gold' : 'bk-text-primary')}>
          {value}
        </div>
      </div>
      {href && <ExternalLink size={12} className="shrink-0 text-gold" />}
    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {content}
      </a>
    )
  }
  return content
}

export default function KlotshoparPage() {
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
      s.name.toLowerCase().includes(q) || (s.city ?? '').toLowerCase().includes(q),
    )
  }, [shops, query])

  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg">
      <div className="px-5 pt-14 pb-4">
        <h1 className="m-0 text-[26px] font-black tracking-tight bk-text-primary">Klotshopar</h1>
        <p className="mt-1 text-[13px] text-dark-muted">
          {loading ? 'Laddar...' : `${shops.length} pro shops i Sverige`}
        </p>
      </div>

      <div className="px-4 pb-4">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5',
            'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
          )}
        >
          <Search size={16} className="shrink-0 text-dark-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök shop eller stad..."
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none bk-text-primary placeholder:text-dark-muted"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[100px] animate-pulse rounded-[18px] border border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card"
              />
            ))
          : filtered.map(shop => {
              const isOpen = expanded === shop.id
              const address = [
                shop.street_address,
                shop.postal_code && shop.city ? `${shop.postal_code} ${shop.city}` : shop.city,
              ]
                .filter(Boolean)
                .join(', ')
              const mapsUrl = address
                ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
                : null

              return (
                <div
                  key={shop.id}
                  className={cn(
                    'overflow-hidden rounded-[18px] border transition-colors duration-200',
                    'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
                    isOpen && 'border-gold/35 shadow-[0_0_20px_rgba(245,194,0,0.08)]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : shop.id)}
                    className="w-full cursor-pointer border-0 bg-transparent p-4 text-left"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base leading-tight font-extrabold bk-text-primary">
                            {shop.name}
                          </span>
                          {shop.ibpsia_certified && (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5',
                                'border-gold/30 bg-gold/10 text-[10px] font-bold text-gold',
                              )}
                            >
                              <Award size={9} /> IBPSIA
                            </span>
                          )}
                        </div>
                        {shop.city && (
                          <div className="mt-1 flex items-center gap-1 text-[13px] text-dark-muted">
                            <MapPin size={12} />
                            {shop.city}
                          </div>
                        )}
                        {shop.accepts_gift_cards && (
                          <span className="mt-2 inline-block rounded-[10px] bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-dark-muted dark:bg-white/6">
                            Presentkort
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'ml-2 shrink-0 text-xl leading-none text-dark-muted transition-transform duration-200',
                          isOpen && 'rotate-90',
                        )}
                        aria-hidden
                      >
                        ›
                      </span>
                    </div>
                  </button>

                  <div
                    className={cn(
                      'grid transition-[grid-template-rows] duration-200 ease-out',
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-light-border px-4 pt-3 pb-4 dark:border-dark-border">
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
                    </div>
                  </div>
                </div>
              )
            })}

        {!loading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-dark-muted">Inga klotshopar hittades</p>
        )}
      </div>
    </div>
  )
}
