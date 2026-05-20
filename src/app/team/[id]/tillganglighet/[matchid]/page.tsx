'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'

type Props = { params: Promise<{ id: string; matchid: string }> }

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

export default function TillganlighetPage({ params }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [teamId, setTeamId] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [poll, setPoll] = useState<any>(null)
  const [myResponse, setMyResponse] = useState<string | null>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [pendingResponse, setPendingResponse] = useState<string | null>(null)

  const bg = isDark ? '#0d1520' : '#f0f4f8'
  const card = isDark ? '#172030' : '#ffffff'
  const border = isDark ? '#2a3858' : '#d0d8e8'
  const text = isDark ? '#ffffff' : '#0d1f35'
  const muted = isDark ? '#6b7a99' : '#4a6080'

  useEffect(() => { params.then(p => { setTeamId(p.id); setMatchId(p.matchid) }) }, [params])

  useEffect(() => {
    if (!teamId || !matchId) return
    const supabase = createClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: m } = await supabase
        .from('matches')
        .select('*, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .eq('id', matchId).single()
      if (m) setMatch(m)

      // Load or create poll
      const { data: existingPoll } = await supabase
        .from('availability_polls')
        .select('*, responses:availability_responses(user_id, response, note)')
        .eq('team_id', teamId).eq('match_id', matchId).single()

      if (existingPoll) {
        setPoll(existingPoll)
        setResponses(existingPoll.responses || [])
        const mine = (existingPoll.responses || []).find((r: any) => r.user_id === session.user.id)
        if (mine) { setMyResponse(mine.response); setNote(mine.note || '') }

        // Load profiles for responses
        const userIds = (existingPoll.responses || []).map((r: any) => r.user_id)
        if (userIds.length > 0) {
          const { data: prof } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
          if (prof) {
            const map: Record<string, any> = {}
            prof.forEach((p: any) => { map[p.id] = p })
            setProfiles(map)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [teamId, matchId])

  const respond = async (response: string, noteText: string = '') => {
    if (!teamId || !matchId || !user) return
    setResponding(true)
    const supabase = createClient()

    let pollId = poll?.id
    if (!pollId) {
      const { data: newPoll } = await supabase
        .from('availability_polls')
        .insert({ team_id: teamId, match_id: matchId, created_by: user.id, question: 'Kan du spela?' })
        .select('id').single()
      if (newPoll) { pollId = newPoll.id; setPoll({ id: pollId, responses: [] }) }
    }

    await supabase.from('availability_responses').upsert({
      poll_id: pollId, user_id: user.id, response, note: noteText || null
    })

    setMyResponse(response)
    setNote(noteText)
    setShowNote(false)
    setPendingResponse(null)

    // Reload responses
    const { data: updated } = await supabase
      .from('availability_polls')
      .select('*, responses:availability_responses(user_id, response, note)')
      .eq('id', pollId).single()
    if (updated) {
      setResponses(updated.responses || [])
      // Load new profiles
      const newIds = (updated.responses || []).map((r: any) => r.user_id).filter((id: string) => !profiles[id])
      if (newIds.length > 0) {
        const { data: prof } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', newIds)
        if (prof) {
          const map = { ...profiles }
          prof.forEach((p: any) => { map[p.id] = p })
          setProfiles(map)
        }
      }
    }
    setResponding(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: muted }}>
      Laddar...
    </div>
  )

  const isHome = match?.home_team_id === teamId
  const opp = isHome ? match?.away : match?.home
  const matchDate = match ? new Date(match.date) : null
  const dateStr = matchDate?.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = matchDate?.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  const yesGroup = responses.filter(r => r.response === 'yes')
  const maybeGroup = responses.filter(r => r.response === 'maybe')
  const noGroup = responses.filter(r => r.response === 'no')
  const total = responses.length



  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: isDark ? '#0d1a2e' : '#e8f0f8', padding: '16px 20px 14px', borderBottom: '1px solid ' + border }}>
        <a href={'/team/' + teamId + '/intern'} style={{ fontSize: 12, color: muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          ← Lagets sida
        </a>
        <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1.5, marginBottom: 4 }}>TILLGANGLIGHET</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: text }}>vs {shortName(opp?.name || '')}</div>
        <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{dateStr} · {timeStr} · {isHome ? 'Hemma' : 'Borta'}</div>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px 20px 48px' }}>

        {/* Match card */}
        <div style={{ background: card, borderRadius: 20, border: '1px solid ' + border, overflow: 'hidden', marginBottom: 20 }}>

          {/* Opponent badge */}
          <div style={{ padding: '20px 20px 16px', textAlign: 'center', background: isDark ? 'linear-gradient(135deg,#0d1a2e,#1a2840)' : 'linear-gradient(135deg,#e8f0f8,#d0e0f0)' }}>
            {(() => {
              const hue = (opp?.name || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
              const tc = 'hsl(' + hue + ',50%,45%)'
              const tclo = isDark ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
              return (
                <div style={{ width: 64, height: 64, borderRadius: 16, background: tclo, border: '2.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: tc, margin: '0 auto 12px' }}>
                  {shortName(opp?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                </div>
              )
            })()}
            <div style={{ fontSize: 22, fontWeight: 900, color: text, marginBottom: 4 }}>
              Kan du spela?
            </div>
            <div style={{ fontSize: 13, color: muted }}>{isHome ? 'Hemma' : 'Borta'} mot {shortName(opp?.name || '')}</div>
          </div>

          {/* Response buttons */}
          <div style={{ padding: '16px 16px 20px' }}>
            {!myResponse ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'yes', label: 'Ja, jag kan spela!', emoji: '✅', color: '#1d9e75', bg: 'rgba(29,158,117,0.12)', border: '#1d9e75' },
                  { key: 'maybe', label: 'Kanske, vet inte an', emoji: '🤔', color: '#f5c200', bg: 'rgba(245,194,0,0.12)', border: '#c9960a' },
                  { key: 'no', label: 'Nej, kan inte', emoji: '❌', color: '#e24b4a', bg: 'rgba(226,75,74,0.12)', border: '#e24b4a' },
                ].map(r => (
                  <button key={r.key}
                    onClick={() => { setPendingResponse(r.key); setShowNote(true) }}
                    disabled={responding}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: r.bg, border: '2px solid ' + r.border, borderRadius: 14, cursor: 'pointer', textAlign: 'left' as const, transition: 'transform 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <span style={{ fontSize: 24 }}>{r.emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: r.color }}>{r.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                {/* My response card */}
                <div style={{ padding: '16px', background: myResponse === 'yes' ? 'rgba(29,158,117,0.12)' : myResponse === 'maybe' ? 'rgba(245,194,0,0.12)' : 'rgba(226,75,74,0.12)', borderRadius: 14, border: '2px solid ' + (myResponse === 'yes' ? '#1d9e75' : myResponse === 'maybe' ? '#c9960a' : '#e24b4a'), textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>
                    {myResponse === 'yes' ? '✅' : myResponse === 'maybe' ? '🤔' : '❌'}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: myResponse === 'yes' ? '#1d9e75' : myResponse === 'maybe' ? '#f5c200' : '#e24b4a', marginBottom: 4 }}>
                    {myResponse === 'yes' ? 'Du spelar!' : myResponse === 'maybe' ? 'Kanske' : 'Du kan inte'}
                  </div>
                  {note && <div style={{ fontSize: 12, color: muted, fontStyle: 'italic' }}>"{note}"</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { key: 'yes', label: 'Ja', color: '#1d9e75' },
                    { key: 'maybe', label: 'Kanske', color: '#f5c200' },
                    { key: 'no', label: 'Nej', color: '#e24b4a' },
                  ].map(r => (
                    <button key={r.key}
                      onClick={() => { if (r.key !== myResponse) { setPendingResponse(r.key); setShowNote(true) } }}
                      style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1.5px solid ' + (myResponse === r.key ? r.color : border), background: myResponse === r.key ? r.color + '22' : 'transparent', color: myResponse === r.key ? r.color : muted, fontSize: 12, fontWeight: 700, cursor: r.key !== myResponse ? 'pointer' : 'default' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note input sheet */}
        {showNote && pendingResponse && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => { setShowNote(false); setPendingResponse(null) }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: card, borderRadius: '20px 20px 0 0', border: '1px solid ' + border, padding: '20px 20px 36px' }}>
              <div style={{ width: 36, height: 4, background: border, borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 4 }}>
                {pendingResponse === 'yes' ? '✅ Ja, jag spelar!' : pendingResponse === 'maybe' ? '🤔 Kanske' : '❌ Kan inte'}
              </div>
              <div style={{ fontSize: 13, color: muted, marginBottom: 14 }}>
                Vill du lagga till en kommentar? (valfritt)
              </div>
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder='T.ex. "Kommer lite sent" eller "Kan om ingen annan kan"...'
                style={{ width: '100%', background: isDark ? '#1c2840' : '#f0f4f8', border: '1px solid ' + border, borderRadius: 10, padding: '11px 14px', color: text, fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' as const }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowNote(false); setPendingResponse(null) }}
                  style={{ flex: 1, background: 'transparent', border: '1px solid ' + border, borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 600, color: muted, cursor: 'pointer' }}>
                  Avbryt
                </button>
                <button onClick={() => respond(pendingResponse!, note)} disabled={responding}
                  style={{ flex: 2, background: pendingResponse === 'yes' ? '#1d9e75' : pendingResponse === 'maybe' ? '#f5c200' : '#e24b4a', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, color: pendingResponse === 'maybe' ? '#1a1400' : '#fff', cursor: 'pointer' }}>
                  {responding ? 'Skickar...' : 'Skicka svar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Response summary */}
        {total > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: muted, letterSpacing: 2, marginBottom: 12 }}>
              LAGETS SVAR ({total} av {responses.length})
            </div>

            {/* Summary bar */}
            <div style={{ background: card, borderRadius: 14, border: '1px solid ' + border, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1d9e75' }}>{yesGroup.length}</div>
                  <div style={{ fontSize: 10, color: muted }}>Ja</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#f5c200' }}>{maybeGroup.length}</div>
                  <div style={{ fontSize: 10, color: muted }}>Kanske</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#e24b4a' }}>{noGroup.length}</div>
                  <div style={{ fontSize: 10, color: muted }}>Nej</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 3, background: border, overflow: 'hidden', display: 'flex' }}>
                {yesGroup.length > 0 && <div style={{ width: (yesGroup.length / total * 100) + '%', background: '#1d9e75', transition: 'width 0.5s' }} />}
                {maybeGroup.length > 0 && <div style={{ width: (maybeGroup.length / total * 100) + '%', background: '#f5c200', transition: 'width 0.5s' }} />}
                {noGroup.length > 0 && <div style={{ width: (noGroup.length / total * 100) + '%', background: '#e24b4a', transition: 'width 0.5s' }} />}
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 3, background: border, overflow: 'hidden', display: 'flex' }}>
                {yesGroup.length > 0 && <div style={{ width: (yesGroup.length / total * 100) + '%', background: '#1d9e75', transition: 'width 0.5s' }} />}
                {maybeGroup.length > 0 && <div style={{ width: (maybeGroup.length / total * 100) + '%', background: '#f5c200', transition: 'width 0.5s' }} />}
                {noGroup.length > 0 && <div style={{ width: (noGroup.length / total * 100) + '%', background: '#e24b4a', transition: 'width 0.5s' }} />}
              </div>
            </div>

            <ResponseGroup group={yesGroup} label="KAN SPELA" color="#1d9e75" bg={isDark ? 'rgba(29,158,117,0.08)' : 'rgba(29,158,117,0.05)'} profiles={profiles} text={text} muted={muted} isDark={isDark} />
            <ResponseGroup group={maybeGroup} label="KANSKE" color="#f5c200" bg={isDark ? 'rgba(245,194,0,0.08)' : 'rgba(245,194,0,0.05)'} profiles={profiles} text={text} muted={muted} isDark={isDark} />
            <ResponseGroup group={noGroup} label="KAN INTE" color="#e24b4a" bg={isDark ? 'rgba(226,75,74,0.08)' : 'rgba(226,75,74,0.05)'} profiles={profiles} text={text} muted={muted} isDark={isDark} />
          </div>
        )}

      </div>
    </div>
  )
}
