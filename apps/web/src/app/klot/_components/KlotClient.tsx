'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, Plus, Check } from 'lucide-react'
import { COLOR, FONT, SPACE } from '@/lib/brand'
import { useSession } from '@/lib/queries'
import { BallOrb } from '@/components/BallOrb'
import { BallSheet } from './BallSheet'
import { useBrands, useCatalog, useMyBalls, useAddBall, type CatalogBall } from '@/lib/balls'

const TOP_BRANDS = 8

export default function KlotClient() {
  const { data: session } = useSession()
  const [query, setQuery]   = useState('')
  const [brand, setBrand]   = useState<string | null>(null)
  const [selected, setSelected] = useState<CatalogBall | null>(null)

  const { data: brands = [] }  = useBrands()
  const { data: balls = [], isLoading } = useCatalog({ query, brand })
  const { data: myBalls = [] } = useMyBalls()
  const add = useAddBall()

  const inBag = new Set(myBalls.filter(b => b.inBag && b.ballId).map(b => b.ballId as string))
  const bag = myBalls.filter(b => b.inBag).slice(0, 10)

  const onAdd = (b: CatalogBall) => {
    if (inBag.has(b.id) || add.isPending) return
    add.mutate(
      { ballId: b.id, customName: null, brand: b.brand, weight: null, surface: null, layout: null, notes: null },
      { onSuccess: () => setSelected(null) },
    )
  }

  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: COLOR.ink3, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '22px 2px 12px' }

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: `${SPACE[4]}px ${SPACE[4]}px 96px` }}>
        <Link href="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4] }}>
          <ChevronLeft size={15} /> Mina spel
        </Link>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: COLOR.gold, textTransform: 'uppercase' }}>Arsenal</div>
        <h1 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, letterSpacing: '-0.01em', margin: '5px 0 6px', lineHeight: 1 }}>Klotdatabas</h1>
        <p style={{ color: COLOR.ink2, fontSize: 15, margin: '0 0 20px' }}>Hela sortimentet — sök, filtrera och lägg till klot i din arsenal.</p>

        {/* search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: COLOR.surface2, borderRadius: 15, padding: '14px 16px' }}>
          <Search size={19} color={COLOR.ink3} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Sök klot, märke eller cover…"
            style={{ all: 'unset', flex: 1, color: COLOR.ink, fontSize: 16, fontFamily: FONT.body }} />
        </div>

        {/* brand filter — ghost chips, active gold */}
        <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '14px 0 4px', scrollbarWidth: 'none' } as React.CSSProperties}>
          <Chip on={brand === null} onClick={() => setBrand(null)}>Alla</Chip>
          {brands.slice(0, TOP_BRANDS).map(b => (
            <Chip key={b.brand} on={brand === b.brand} onClick={() => setBrand(b.brand)}>{b.brand}</Chip>
          ))}
        </div>

        {/* arsenal strip */}
        {bag.length > 0 && (
          <>
            <div style={lbl}>Din arsenal <span style={{ fontFamily: FONT.score, fontWeight: 600, fontSize: 13, letterSpacing: 0 }}>{myBalls.filter(b => b.inBag).length} klot</span></div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '2px 2px 6px', scrollbarWidth: 'none' } as React.CSSProperties}>
              {bag.map(b => (
                <div key={b.id} style={{ flex: 'none', width: 88, textAlign: 'center' }}>
                  <BallOrb name={b.name} imageUrl={b.imageUrl} size={64} />
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: COLOR.ink3 }}>{b.brand ?? ''}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* catalog list */}
        <div style={lbl}>Sortiment</div>
        {isLoading ? (
          <p style={{ color: COLOR.ink3, fontSize: 14, padding: '24px 0', textAlign: 'center' }}>Hämtar klot…</p>
        ) : balls.length === 0 ? (
          <p style={{ color: COLOR.ink3, fontSize: 14, padding: '24px 0', textAlign: 'center' }}>Inga klot matchar. Kör balls-sync om databasen är tom.</p>
        ) : (
          balls.map(b => {
            const has = inBag.has(b.id)
            return (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 2px', borderTop: `1px solid ${COLOR.hairline}` }}>
                <button onClick={() => setSelected(b)} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                  <BallOrb name={b.name} imageUrl={b.thumbnailUrl ?? b.imageUrl} size={52} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: COLOR.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                    <span style={{ display: 'block', fontSize: 13, color: COLOR.ink3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{b.brand}{b.coverstockType ? ` · ${b.coverstockType.split(' ')[0]}` : ''}</span>
                  </span>
                </button>
                <span style={{ textAlign: 'right', marginRight: 4, flex: 'none' }}>
                  <span style={{ display: 'block', fontFamily: FONT.score, fontWeight: 700, fontSize: 16, color: COLOR.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{b.rg != null ? b.rg.toFixed(2) : '–'}</span>
                  <span style={{ display: 'block', fontSize: 11, color: COLOR.ink3, marginTop: 3 }}>RG</span>
                </span>
                <button onClick={() => onAdd(b)} disabled={has || !session} aria-label={has ? 'I arsenal' : 'Lägg till'}
                  style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', border: `1px solid ${COLOR.hairline}`,
                    background: has ? 'rgba(48,212,126,.14)' : COLOR.surface, color: has ? COLOR.green : COLOR.gold,
                    display: 'grid', placeItems: 'center', cursor: has || !session ? 'default' : 'pointer' }}>
                  {has ? <Check size={20} /> : <Plus size={22} />}
                </button>
              </div>
            )
          })
        )}

        {/* free entry — for a klot not in the catalog yet */}
        <Link href="/arsenal/add" style={{ display: 'block', textAlign: 'center', padding: '18px 0 4px', fontSize: 14, fontWeight: 600, color: COLOR.ink2, textDecoration: 'none' }}>
          Hittar du inte klotet? Lägg till manuellt →
        </Link>

        {/* attribution — required, hairline strip (cardless) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${COLOR.hairline}` }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${COLOR.gold}`, display: 'grid', placeItems: 'center', color: COLOR.gold, fontFamily: FONT.display, fontWeight: 800, fontSize: 19, flex: 'none' }}>b</span>
          <span style={{ fontSize: 14, color: COLOR.ink2 }}><b style={{ color: COLOR.ink, fontWeight: 700 }}>Klotdata från bowwwl.com</b> — spec, cores &amp; covers via Aarons öppna API.</span>
        </div>
      </div>

      <BallSheet ball={selected} inBag={selected ? inBag.has(selected.id) : false} adding={add.isPending} onClose={() => setSelected(null)} onAdd={onAdd} />
    </main>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex: 'none', padding: '10px 15px', borderRadius: 999, minHeight: 44,
      background: on ? COLOR.gold : 'transparent', color: on ? '#1a1400' : COLOR.ink3,
      border: 'none', fontSize: 15, fontWeight: on ? 700 : 600, cursor: 'pointer', fontFamily: FONT.body }}>{children}</button>
  )
}
