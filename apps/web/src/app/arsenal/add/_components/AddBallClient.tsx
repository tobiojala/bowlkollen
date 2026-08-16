'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search } from 'lucide-react'
import { useSession } from '@/lib/queries'
import { useCatalogSearch, useAddBall, type CatalogBall } from '@/lib/balls'

const BG = '#0b0d10'
const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const GOLD = '#f5c200'
const SURFACE = '#14171c'
const HAIR = 'rgba(244,245,247,0.08)'

const WEIGHTS = [16, 15, 14, 13, 12, 11, 10]

export default function AddBallClient() {
  const router = useRouter()
  const { data: session, isLoading } = useSession()
  const add = useAddBall()

  const [query, setQuery] = useState('')
  const { data: catalog = [] } = useCatalogSearch(query)
  const [picked, setPicked] = useState<CatalogBall | null>(null)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [weight, setWeight] = useState<number | null>(15)
  const [surface, setSurface] = useState('')
  const [layout, setLayout] = useState('')
  const [notes, setNotes] = useState('')

  if (!isLoading && !session) { if (typeof window !== 'undefined') window.location.href = '/login'; return null }

  const displayName = picked?.name ?? name.trim()
  const canSave = !!displayName && !add.isPending

  const choose = (c: CatalogBall) => { setPicked(c); setName(c.name); setBrand(c.brand); setQuery('') }
  const clearPick = () => { setPicked(null) }

  const save = () => {
    add.mutate({
      ballId: picked?.id ?? null,
      customName: picked ? null : displayName,
      brand: brand.trim() || null,
      weight, surface: surface || null, layout: layout || null, notes: notes || null,
    }, { onSuccess: () => router.push('/profile') })
  }

  const input: React.CSSProperties = {
    width: '100%', background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 12,
    padding: '14px 16px', fontSize: 16, color: INK, outline: 'none',
  }
  const label: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: INK3, letterSpacing: '0.08em', margin: '4px 2px' }

  return (
    <main style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: "var(--font-body,'DM Sans'),system-ui" }}>
      <div style={{ padding: '16px 24px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: INK2, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '4px 0', alignSelf: 'flex-start' }}>
          <ChevronLeft size={20} color={INK2} /> Tillbaka
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, margin: '4px 0 4px' }}>Lägg till klot</h1>

        {/* Catalog type-ahead (empty until seeded) */}
        {!picked && (
          <div>
            <div style={{ position: 'relative' }}>
              <Search size={18} color={INK3} style={{ position: 'absolute', left: 14, top: 15 }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sök klot (märke eller modell)" style={{ ...input, paddingLeft: 42 }} />
            </div>
            {catalog.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {catalog.map((c) => (
                  <button key={c.id} onClick={() => choose(c)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left', cursor: 'pointer',
                      background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 16px' }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: INK }}>{c.name}</span>
                    <span style={{ fontSize: 13, color: INK3 }}>{c.brand}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Name + brand (free entry, or confirming the picked catalog ball) */}
        {picked ? (
          <div style={{ background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>{picked.name}</div>
            <div style={{ fontSize: 13, color: INK3, marginTop: 2 }}>{picked.brand}</div>
            <button onClick={clearPick} style={{ marginTop: 8, background: 'none', border: 'none', color: GOLD, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Skriv in manuellt</button>
          </div>
        ) : (
          <>
            <div><div style={label}>MODELL</div><input value={name} onChange={(e) => setName(e.target.value)} placeholder="t.ex. Phaze II" style={input} /></div>
            <div><div style={label}>MÄRKE</div><input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="t.ex. Storm" style={input} /></div>
          </>
        )}

        {/* Weight */}
        <div>
          <div style={label}>VIKT</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {WEIGHTS.map((w) => (
              <button key={w} onClick={() => setWeight(w)}
                style={{ padding: '10px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 15, fontWeight: 700,
                  background: weight === w ? 'rgba(245,194,0,0.14)' : SURFACE, border: `1px solid ${weight === w ? 'rgba(245,194,0,0.4)' : HAIR}`, color: weight === w ? GOLD : INK }}>
                {w} lb
              </button>
            ))}
          </div>
        </div>

        <div><div style={label}>YTA / GRIT (valfritt)</div><input value={surface} onChange={(e) => setSurface(e.target.value)} placeholder="t.ex. 2000 abralon" style={input} /></div>
        <div><div style={label}>LAYOUT (valfritt)</div><input value={layout} onChange={(e) => setLayout(e.target.value)} placeholder="t.ex. 4½ × 4 × 2½" style={input} /></div>
        <div><div style={label}>ANTECKNING (valfritt)</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Hur klotet rullar, när det passar…" style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <button onClick={save} disabled={!canSave}
          style={{ marginTop: 8, background: GOLD, color: '#1a1400', border: 'none', borderRadius: 999, padding: 16, fontSize: 16, fontWeight: 700,
            cursor: canSave ? 'pointer' : 'default', opacity: canSave ? 1 : 0.5 }}>
          {add.isPending ? 'Sparar…' : 'Lägg till i väskan'}
        </button>
      </div>
    </main>
  )
}
