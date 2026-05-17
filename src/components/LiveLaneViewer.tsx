'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Props = {
  streamUrl: string
  matchName?: string
}

type ScoringData = {
  alleyID: string
  lanes: number
  session: string
  screenfolders: string[]
}

function buildImageUrl(alleyID: string, folder: string, lane: number, bust: number) {
  return `https://scoring.se/${alleyID}/${folder}/${lane}_small.jpg?nocache=${bust}`
}

export default function LiveLaneViewer({ streamUrl, matchName }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [data, setData] = useState<ScoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bust, setBust] = useState(Math.floor(Math.random() * 99999))
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeLanes, setActiveLanes] = useState<number | null>(null)

  // Convert stream URL to mobile URL
  const getMobileUrl = (url: string) => {
    const alleyMatch = url.match(/alley=(\d+)/)
    if (alleyMatch) {
      return `https://scoring.se/mobile/scoring.asp?alley=${alleyMatch[1]}`
    }
    return url
  }

  useEffect(() => {
    const mobileUrl = getMobileUrl(streamUrl)
    fetch('/api/scoring?url=' + encodeURIComponent(mobileUrl))
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [streamUrl])

  // Auto-refresh images every 3 seconds
  useEffect(() => {
    if (!data) return
    const interval = setInterval(() => {
      setBust(Math.floor(Math.random() * 99999))
      setLastUpdate(new Date())
    }, 3000)
    return () => clearInterval(interval)
  }, [data])

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
        Ansluter till live scoring...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 12 }}>
          Kunde inte ansluta till scoring.se
        </div>
        <a href={streamUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Oppna i scoring.se istallet &#8599;
        </a>
      </div>
    )
  }

  const totalLanes = data.lanes
  const displayLanes = activeLanes || totalLanes

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + C.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e05555', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Live Scoring</span>
          {lastUpdate && (
            <span style={{ fontSize: 10, color: C.textMuted }}>
              Uppdaterad {lastUpdate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>Visa banor:</span>
          {[4, 8, totalLanes].filter((v, i, a) => a.indexOf(v) === i && v <= totalLanes).map(n => (
            <button key={n} onClick={() => setActiveLanes(n === totalLanes && activeLanes === null ? null : n)} style={{ background: (activeLanes === n || (activeLanes === null && n === totalLanes)) ? C.accent : C.card, color: (activeLanes === n || (activeLanes === null && n === totalLanes)) ? '#1a1400' : C.textMuted, border: '1px solid ' + C.border, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {n}
            </button>
          ))}
          <a href={streamUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, fontWeight: 700, textDecoration: 'none', marginLeft: 4 }}>
            Fullskarm &#8599;
          </a>
        </div>
      </div>

      {/* Lane grid */}
      <div style={{ padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {Array.from({ length: displayLanes }, (_, i) => i + 1).map(lane => {
            const folder = data.screenfolders[lane]
            if (!folder) return null
            const imgUrl = buildImageUrl(data.alleyID, folder, lane, bust)
            return (
              <div key={lane} style={{ borderRadius: 8, overflow: 'hidden', background: '#000', position: 'relative', border: '1px solid ' + C.border }}>
                <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: 'white', zIndex: 1 }}>
                  Bana {lane}
                </div>
                <img
                  src={imgUrl}
                  alt={'Bana ' + lane}
                  style={{ width: '100%', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                />
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 10, fontSize: 10, color: C.textMuted, textAlign: 'center' }}>
          Bilder fran scoring.se &middot; Uppdateras var 3:e sekund &middot; {totalLanes} banor totalt
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
