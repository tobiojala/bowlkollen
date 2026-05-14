'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

import './live.css'
import LiveScoreBoard from "@/components/LiveScoreBoard"
type Match = {
  id: string
  date: string
  status: string
  home_score: number | null
  away_score: number | null
  venue: string
  stream_url: string
  round: number
  home: { id: string; name: string }
  away: { id: string; name: string }
}

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').trim()
}


function demoScoreForMatch(matchId: string | number) {
  const seed = Number(String(matchId).replace(/\D/g, "").slice(-3)) || 120
  const homeScore = seed % 3 === 0 ? 10 : seed % 2 === 0 ? 12 : 14
  const awayScore = 20 - homeScore
  return { homeScore, awayScore }
}

function streamProvider(url: string) {
  if (!url) return { name: 'Live Scoring', color: '#4caf7d' }
  if (url.includes('scoring.se')) return { name: 'Scoring.se', color: '#2196f3' }
  if (url.includes('bowlit.nu')) return { name: 'Bowlit Live', color: '#9c27b0' }
  if (url.includes('lanetalk')) return { name: 'LaneTalk', color: '#ff9800' }
  if (url.includes('qubicaamf')) return { name: 'QubicaAMF', color: '#e91e63' }
  if (url.includes('bowlingpalatzet')) return { name: 'Bowlingpalatzet', color: '#00bcd4' }
  if (url.includes('bowlit.se')) return { name: 'Bowlit', color: '#9c27b0' }
  if (url.includes('bowlare')) return { name: 'Bowlare.se', color: '#4caf7d' }
  return { name: 'Live Scoring', color: '#4caf7d' }
}

export default function LivePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [selected, setSelected] = useState<Match | null>(null)
  const [iframeError, setIframeError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    // Get recent + upcoming matches with stream URLs
    supabase
      .from('matches')
      .select('id, date, status, home_score, away_score, venue, stream_url, round, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
      .not('stream_url', 'is', null)
      .not('stream_url', 'eq', '')
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) {
          const matchData = data as unknown as Match[]
          setMatches(matchData)
          // Auto-select most recent match
          const live = matchData.find(m => m.status === 'live')
          setSelected(live || matchData[0] || null)
        }
        setLoading(false)
      })
  }, [])

  const homeHue = (selected?.home?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const awayHue = (selected?.away?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
  const tclo = (hue: number) => theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
  const selectedLiveScore = selected ? demoScoreForMatch(selected.id) : { homeScore: null, awayScore: null }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div className="live-shell">

        <div className="live-topbar">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 4 }}>Live Center</h1>
            <div style={{ fontSize: 13, color: C.textMuted }}>Direktresultat fran bowling-hallarna</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: C.textMuted }}>Uppdateras i realtid</span>
          </div>
        </div>

        <div className="live-layout">

          {/* Match list */}
          <div className="live-match-list">
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 4 }}>MATCHER</div>
            {loading && (
              <div style={{ background: C.card, borderRadius: 10, border: '1px solid ' + C.border, padding: 16, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>Laddar...</div>
            )}
            {!loading && matches.length === 0 && (
              <div style={{ background: C.card, borderRadius: 10, border: '1px solid ' + C.border, padding: 16, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>Inga matcher med live scoring</div>
            )}
            {matches.map(m => {
              const isSelected = selected?.id === m.id
              const provider = streamProvider(m.stream_url)
              const hh = (m.home?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const ah = (m.away?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const liveScore = demoScoreForMatch(m.id)
              const homeWin = liveScore.homeScore > liveScore.awayScore
              const awayWin = liveScore.awayScore > liveScore.homeScore

              return (
                <div
                  key={m.id}
                  onClick={() => { setSelected(m); setIframeError(false) }}
                  style={{
                    background: isSelected ? (theme === 'dark' ? 'rgba(245,194,0,0.08)' : 'rgba(10,92,138,0.05)') : C.card,
                    borderRadius: 10,
                    border: '1px solid ' + (isSelected ? C.accent : C.border),
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{m.date?.slice(0, 10)} &middot; O{m.round}</div>
                    {m.status === 'live' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />
                        <span style={{ fontSize: 8, fontWeight: 800, color: '#e05555', letterSpacing: 1 }}>LIVE</span>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: tclo(hh), border: '1.5px solid ' + tc(hh), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: tc(hh), flexShrink: 0 }}>
                      {shortName(m.home?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: homeWin ? 700 : 400, color: homeWin ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortName(m.home?.name || '')}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: homeWin ? C.accent : C.textMuted, minWidth: 20, textAlign: 'right' }}>{liveScore.homeScore}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: tclo(ah), border: '1.5px solid ' + tc(ah), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: tc(ah), flexShrink: 0 }}>
                      {shortName(m.away?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: awayWin ? 700 : 400, color: awayWin ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortName(m.away?.name || '')}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: awayWin ? C.accent : C.textMuted, minWidth: 20, textAlign: 'right' }}>{liveScore.awayScore}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: provider.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: C.textMuted }}>{provider.name}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Iframe panel */}
          <div className="live-detail-panel">
            {selected && (
              <>
                {/* Match header */}
                <div className="live-match-header" style={{ background: C.card, border: '1px solid ' + C.border, borderBottom: 'none' }}>
                  <div className="live-match-title-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: tclo(homeHue), border: '2px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: tc(homeHue), flexShrink: 0 }}>
                        {shortName(selected.home?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: (selectedLiveScore.homeScore ?? 0) > (selectedLiveScore.awayScore ?? 0) ? C.accent : C.text }}>
                        {shortName(selected.home?.name || '')}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      {selectedLiveScore.homeScore !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 28, fontWeight: 900, color: (selectedLiveScore.homeScore ?? 0) > (selectedLiveScore.awayScore ?? 0) ? C.accent : C.text }}>{selectedLiveScore.homeScore}</span>
                          <span style={{ fontSize: 16, color: C.textMuted }}>-</span>
                          <span style={{ fontSize: 28, fontWeight: 900, color: (selectedLiveScore.awayScore ?? 0) > (selectedLiveScore.homeScore ?? 0) ? C.accent : C.text }}>{selectedLiveScore.awayScore}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 18, color: C.textMuted, fontWeight: 600 }}>vs</div>
                      )}
                      <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 0.5 }}>MATCHPOANG</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: (selectedLiveScore.awayScore ?? 0) > (selectedLiveScore.homeScore ?? 0) ? C.accent : C.text, textAlign: 'right' }}>
                        {shortName(selected.away?.name || '')}
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: tclo(awayHue), border: '2px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: tc(awayHue), flexShrink: 0 }}>
                        {shortName(selected.away?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {selected.venue && <span style={{ fontSize: 11, color: C.textMuted }}>{selected.venue}</span>}
                    <span style={{ fontSize: 11, color: C.textMuted }}>{selected.date?.slice(0, 10)}</span>
                    <div className="live-provider-row">
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: streamProvider(selected.stream_url).color }} />
                      <span style={{ fontSize: 11, color: C.textMuted }}>{streamProvider(selected.stream_url).name}</span>
                      <a href={selected.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, fontWeight: 700, textDecoration: 'none', marginLeft: 4 }}>
                        Oppna i ny flik &#8599;
                      </a>
                    </div>
                  </div>
                </div>

                {/* Custom Bowlkollen Live Scoring */}
                <LiveScoreBoard matchId={selected.id} homeTeam={selected.home?.name} awayTeam={selected.away?.name} />

                {/* Note */}
                <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted, textAlign: 'center' }}>
                  Live scoring tillhandahalls av {streamProvider(selected.stream_url).name}. Data uppdateras automatiskt.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}