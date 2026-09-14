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
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: COLOR.ink3, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '22px 2px 12px' }
const count: React.CSSProperties = { fontFamily: FONT.score, fontWeight: 600, fontSize: 13, letterSpacing: 0 }

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
  const bag = myBalls.filter(b => b.inBag)

  const onAdd = (b: CatalogBall, weight = 15) => {
    if (inBag.has(b.id) || add.isPending) return
    add.mutate(
      { ballId: b.id, customName: null, brand: b.brand, weight, surface: null, layout: null, notes: null },
      { onSuccess: () => setSelected(null) },
    )
  }

  const shelf = (
    <>
      <div style={lbl}>Din arsenal <span style={count}>{bag.length} klot</span></div>
      {bag.length === 0 ? (
        <p style={{ color: COLOR.ink3, fontSize: 14, margin: '0 2px' }}>Lägg till klot du spelar med så samlas de här.</p>
      ) : (
        <div className="shelf">
          {bag.map(b => (
            <div key={b.id} className="shelf-item">
              <BallOrb name={b.name} imageUrl={b.imageUrl} size={56} />
              <div className="shelf-meta">
                <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                <div style={{ fontSize: 13, color: COLOR.ink3 }}>{[b.brand, b.weight != null ? `${b.weight} lb` : null].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <style>{`
        /* Same web layout as the home feed: 600 mobile → 1160 desktop with a
           minmax(0,1fr) 320 split + a sticky right rail. */
        .klot-wrap { max-width: 600px; margin: 0 auto; padding: 16px 16px 96px; }
        .klot-main { min-width: 0; }
        .klot-grid { display: block; }
        .arsenal-strip { display: block; }
        .klot-side { display: none; }
        .deskstat { display: none; }
        .shelf { display: flex; gap: 16px; overflow-x: auto; padding: 2px 2px 6px; scrollbar-width: none; }
        .shelf::-webkit-scrollbar { display: none; }
        .shelf-item { flex: none; width: 96px; text-align: center; }
        .shelf-item .shelf-meta > div:first-child { margin-top: 9px; }
        @media (min-width: 1024px) {
          .klot-wrap { max-width: 1160px; padding: 24px 32px 96px; }
          .klot-grid { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 40px; align-items: start; }
          .arsenal-strip { display: none; }
          .klot-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 88px; }
          .deskstat { display: block; }
          .shelf { flex-direction: column; gap: 4px; overflow: visible; }
          .shelf-item { width: auto; text-align: left; display: flex; align-items: center; gap: 12px; padding: 8px 2px; border-top: 1px solid ${COLOR.hairline}; }
          .shelf-item .shelf-meta { flex: 1; min-width: 0; }
          .shelf-item .shelf-meta > div:first-child { margin-top: 0; }
        }
      `}</style>
      <div className="klot-wrap">
        <Link href="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4] }}>
          <ChevronLeft size={15} /> Mina spel
        </Link>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: COLOR.gold, textTransform: 'uppercase' }}>Arsenal</div>
        <h1 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, letterSpacing: '-0.01em', margin: '5px 0 6px', lineHeight: 1 }}>Klothyllan</h1>
        <p style={{ color: COLOR.ink2, fontSize: 15, margin: '0 0 20px' }}>Hela sortimentet — sök, filtrera och lägg till klot i din arsenal.</p>

        <div className="klot-grid">
          {/* ── Left: catalog ── */}
          <div className="klot-main">
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: COLOR.surface2, borderRadius: 15, padding: '14px 16px' }}>
              <Search size={19} color={COLOR.ink3} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Sök klot, märke eller cover…"
                style={{ all: 'unset', flex: 1, color: COLOR.ink, fontSize: 16, fontFamily: FONT.body }} />
            </div>
            <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '14px 0 4px', scrollbarWidth: 'none' } as React.CSSProperties}>
              <Chip on={brand === null} onClick={() => setBrand(null)}>Alla</Chip>
              {brands.slice(0, TOP_BRANDS).map(b => <Chip key={b.brand} on={brand === b.brand} onClick={() => setBrand(b.brand)}>{b.brand}</Chip>)}
            </div>

            {/* arsenal reel — mobile only (desktop shows the right shelf) */}
            {bag.length > 0 && <div className="arsenal-strip">{shelf}</div>}

            <div style={lbl}>Sortiment {balls.length >= 80 && <span style={count}>80+</span>}</div>
            {isLoading ? (
              <p style={{ color: COLOR.ink3, fontSize: 14, padding: '24px 0', textAlign: 'center' }}>Hämtar klot…</p>
            ) : balls.length === 0 ? (
              <p style={{ color: COLOR.ink3, fontSize: 14, padding: '24px 0', textAlign: 'center' }}>Inga klot matchar.</p>
            ) : balls.map(b => {
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
                  <span className="deskstat" style={{ textAlign: 'right', marginRight: 18, flex: 'none' }}>
                    <span style={{ display: 'block', fontFamily: FONT.score, fontWeight: 700, fontSize: 16, color: COLOR.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{b.differential != null ? b.differential.toFixed(3).replace(/^0/, '') : '–'}</span>
                    <span style={{ display: 'block', fontSize: 11, color: COLOR.ink3, marginTop: 3 }}>Diff</span>
                  </span>
                  <span style={{ textAlign: 'right', marginRight: 4, flex: 'none' }}>
                    <span style={{ display: 'block', fontFamily: FONT.score, fontWeight: 700, fontSize: 16, color: COLOR.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{b.rg != null ? b.rg.toFixed(2) : '–'}</span>
                    <span style={{ display: 'block', fontSize: 11, color: COLOR.ink3, marginTop: 3 }}>RG</span>
                  </span>
                  <button onClick={() => onAdd(b)} disabled={has || !session} aria-label={has ? 'I arsenal' : 'Lägg till'}
                    style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', border: `1px solid ${COLOR.hairline}`, background: has ? 'rgba(48,212,126,.14)' : COLOR.surface, color: has ? COLOR.green : COLOR.gold, display: 'grid', placeItems: 'center', cursor: has || !session ? 'default' : 'pointer' }}>
                    {has ? <Check size={20} /> : <Plus size={22} />}
                  </button>
                </div>
              )
            })}

            <Link href="/arsenal/add" style={{ display: 'block', textAlign: 'center', padding: '18px 0 4px', fontSize: 14, fontWeight: 600, color: COLOR.ink2, textDecoration: 'none' }}>
              Hittar du inte klotet? Lägg till manuellt →
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${COLOR.hairline}` }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${COLOR.gold}`, display: 'grid', placeItems: 'center', color: COLOR.gold, fontFamily: FONT.display, fontWeight: 800, fontSize: 19, flex: 'none' }}>b</span>
              <span style={{ fontSize: 14, color: COLOR.ink2 }}><b style={{ color: COLOR.ink, fontWeight: 700 }}>Klotdata från bowwwl.com</b> — spec, cores &amp; covers via Aarons öppna API.</span>
            </div>
          </div>

          {/* ── Right: your shelf (desktop) ── */}
          <aside className="klot-side">{shelf}</aside>
        </div>
      </div>

      <BallSheet ball={selected} inBag={selected ? inBag.has(selected.id) : false} adding={add.isPending} onClose={() => setSelected(null)} onAdd={onAdd} />
    </main>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex: 'none', padding: '10px 15px', borderRadius: 999, minHeight: 44, background: on ? COLOR.gold : 'transparent', color: on ? '#1a1400' : COLOR.ink3, border: 'none', fontSize: 15, fontWeight: on ? 700 : 600, cursor: 'pointer', fontFamily: FONT.body }}>{children}</button>
  )
}
