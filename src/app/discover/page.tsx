'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { COLOR } from '@/lib/brand'
import { SEARCH_MIN } from './_components/queries'
import { SearchResults } from './_components/SearchResults'
import { Shelves } from './_components/Shelves'

export default function DiscoverPage() {
  const [query,      setQuery]      = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const isSearching = debouncedQ.trim().length >= SEARCH_MIN

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px 80px' }}>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color={COLOR.ink3} style={{ position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök spelare, lag eller division…"
            autoComplete="off"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: COLOR.surface, border: 'none', borderRadius: 14,
              padding: '14px 40px 14px 42px',
              fontSize: 15, color: COLOR.ink, outline: 'none',
              fontFamily: "var(--font-body, 'DM Sans', system-ui)",
            }}
          />
          {query.length > 0 && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus() }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                display: 'flex', alignItems: 'center' }}>
              <X size={15} color={COLOR.ink4} />
            </button>
          )}
        </div>

        {isSearching ? <SearchResults query={debouncedQ} /> : <Shelves />}

      </div>
    </main>
  )
}
