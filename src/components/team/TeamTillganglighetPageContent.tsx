'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Check, X, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  tillganglighetAvatarImg,
  tillganglighetBackLink,
  tillganglighetCard,
  tillganglighetCardBody,
  tillganglighetEyebrow,
  tillganglighetHeader,
  tillganglighetHero,
  tillganglighetInput,
  tillganglighetMain,
  tillganglighetMaybeBtn,
  tillganglighetMaybeLabel,
  tillganglighetMemberName,
  tillganglighetMemberNote,
  tillganglighetMemberRow,
  tillganglighetMeta,
  tillganglighetNoBtn,
  tillganglighetNoLabel,
  tillganglighetPageRoot,
  tillganglighetProgressTrack,
  tillganglighetQuestion,
  tillganglighetResponseBtn,
  tillganglighetSelectedPanel,
  tillganglighetSelectedTitle,
  tillganglighetSheet,
  tillganglighetSheetBackdrop,
  tillganglighetSheetCancel,
  tillganglighetSheetHandle,
  tillganglighetSheetSubmit,
  tillganglighetStatValue,
  tillganglighetStatsCard,
  tillganglighetStatsSection,
  tillganglighetTitle,
  tillganglighetMemberAvatarStyle,
  tillganglighetOpponentHeroStyle,
  tillganglighetProgressWidth,
  tillganglighetToggleActiveStyle,
  tillganglighetYesBtn,
  tillganglighetYesLabel,
} from '@/lib/team-tillganglighet-ui'

type Props = { params: Promise<{ id: string; matchid: string }> }

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function nameHue(name: string) {
  return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
}

const RESPONSE_OPTIONS = [
  { key: 'yes', label: 'Ja, jag kan spela!', Icon: Check, btn: tillganglighetYesBtn, labelClass: tillganglighetYesLabel, iconColor: '#1d9e75' },
  { key: 'maybe', label: 'Kanske, vet inte an', Icon: HelpCircle, btn: tillganglighetMaybeBtn, labelClass: tillganglighetMaybeLabel, iconColor: '#f5c200' },
  { key: 'no', label: 'Nej, kan inte', Icon: X, btn: tillganglighetNoBtn, labelClass: tillganglighetNoLabel, iconColor: '#e24b4a' },
] as const

const TOGGLE_OPTIONS = [
  { key: 'yes', label: 'Ja', color: '#1d9e75' },
  { key: 'maybe', label: 'Kanske', color: '#f5c200' },
  { key: 'no', label: 'Nej', color: '#e24b4a' },
] as const

export function TeamTillganglighetPageContent({ params }: Props) {
  const [teamId, setTeamId] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [match, setMatch] = useState<Record<string, unknown> | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [poll, setPoll] = useState<{ id: string; responses?: unknown[] } | null>(null)
  const [myResponse, setMyResponse] = useState<string | null>(null)
  const [responses, setResponses] = useState<{ user_id: string; response: string; note: string | null }[]>([])
  const [profiles, setProfiles] = useState<Record<string, { full_name?: string; avatar_url?: string }>>({})
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [pendingResponse, setPendingResponse] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setTeamId(p.id)
      setMatchId(p.matchid)
    })
  }, [params])

  useEffect(() => {
    if (!teamId || !matchId) return
    const supabase = createClient()
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      setUser(session.user)

      const { data: m } = await supabase
        .from('matches')
        .select('*, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .eq('id', matchId)
        .single()
      if (m) setMatch(m as Record<string, unknown>)

      const { data: existingPoll } = await supabase
        .from('availability_polls')
        .select('*, responses:availability_responses(user_id, response, note)')
        .eq('team_id', teamId)
        .eq('match_id', matchId)
        .single()

      if (existingPoll) {
        setPoll(existingPoll)
        setResponses((existingPoll.responses || []) as typeof responses)
        const mine = (existingPoll.responses || []).find(
          (r: { user_id: string }) => r.user_id === session.user.id,
        ) as { response: string; note: string | null } | undefined
        if (mine) {
          setMyResponse(mine.response)
          setNote(mine.note || '')
        }
        const userIds = (existingPoll.responses || []).map((r: { user_id: string }) => r.user_id)
        if (userIds.length > 0) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds)
          if (prof) {
            const map: Record<string, (typeof prof)[0]> = {}
            prof.forEach(p => {
              map[p.id] = p
            })
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
        .select('id')
        .single()
      if (newPoll?.id) {
        pollId = newPoll.id
        setPoll({ id: newPoll.id, responses: [] })
      }
    }
    await supabase
      .from('availability_responses')
      .upsert({ poll_id: pollId, user_id: user.id, response, note: noteText || null })
    setMyResponse(response)
    setNote(noteText)
    setShowNote(false)
    setPendingResponse(null)
    const { data: updated } = await supabase
      .from('availability_polls')
      .select('*, responses:availability_responses(user_id, response, note)')
      .eq('id', pollId)
      .single()
    if (updated) {
      setResponses((updated.responses || []) as typeof responses)
      const newIds = (updated.responses || [])
        .map((r: { user_id: string }) => r.user_id)
        .filter((id: string) => !profiles[id])
      if (newIds.length > 0) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', newIds)
        if (prof) {
          const map = { ...profiles }
          prof.forEach(p => {
            map[p.id] = p
          })
          setProfiles(map)
        }
      }
    }
    setResponding(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-sans text-dark-muted">
        Laddar...
      </div>
    )
  }

  const home = match?.home as { name?: string } | undefined
  const away = match?.away as { name?: string } | undefined
  const isHome = match?.home_team_id === teamId
  const opp = isHome ? away : home
  const matchDate = match?.date ? new Date(match.date as string) : null
  const dateStr = matchDate?.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = matchDate?.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  const yesGroup = responses.filter(r => r.response === 'yes')
  const maybeGroup = responses.filter(r => r.response === 'maybe')
  const noGroup = responses.filter(r => r.response === 'no')
  const total = responses.length

  const oppName = shortName(opp?.name || '')
  const oppHue = nameHue(oppName)
  const oppTc = `hsl(${oppHue},50%,45%)`
  const oppTclo = `hsl(${oppHue},40%,15%)`

  return (
    <div className={tillganglighetPageRoot}>
      <div className={tillganglighetHeader}>
        <a href={`/team/${teamId}/intern`} className={tillganglighetBackLink}>
          ← Lagets sida
        </a>
        <div className={tillganglighetEyebrow}>TILLGANGLIGHET</div>
        <div className={tillganglighetTitle}>vs {oppName}</div>
        <div className={tillganglighetMeta}>
          {dateStr} · {timeStr} · {isHome ? 'Hemma' : 'Borta'}
        </div>
      </div>

      <div className={tillganglighetMain}>
        <div className={tillganglighetCard}>
          <div className={tillganglighetHero}>
            <div
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-black dark:bg-[hsl(var(--opp-h),40%,15%)]"
              style={tillganglighetOpponentHeroStyle(oppTc, oppTclo, oppHue)}
            >
              {oppName
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 3)
                .toUpperCase()}
            </div>
            <div className={tillganglighetQuestion}>Kan du spela?</div>
            <div className="text-[13px] text-dark-muted">
              {isHome ? 'Hemma' : 'Borta'} mot {oppName}
            </div>
          </div>

          <div className={tillganglighetCardBody}>
            {!myResponse ? (
              <div className="flex flex-col gap-2.5">
                {RESPONSE_OPTIONS.map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      setPendingResponse(r.key)
                      setShowNote(true)
                    }}
                    disabled={responding}
                    className={r.btn}
                  >
                    <r.Icon size={24} color={r.iconColor} />
                    <span className={r.labelClass}>{r.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className={tillganglighetSelectedPanel(myResponse)}>
                  <div className="mb-1.5">
                    {myResponse === 'yes' ? (
                      <Check size={32} color="#1d9e75" />
                    ) : myResponse === 'maybe' ? (
                      <HelpCircle size={32} color="#f5c200" />
                    ) : (
                      <X size={32} color="#e24b4a" />
                    )}
                  </div>
                  <div className={tillganglighetSelectedTitle(myResponse)}>
                    {myResponse === 'yes' ? 'Du spelar!' : myResponse === 'maybe' ? 'Kanske' : 'Du kan inte'}
                  </div>
                  {note && <div className="text-xs italic text-dark-muted">&quot;{note}&quot;</div>}
                </div>
                <div className="flex gap-2">
                  {TOGGLE_OPTIONS.map(r => {
                    const active = myResponse === r.key
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => {
                          if (r.key !== myResponse) {
                            setPendingResponse(r.key)
                            setShowNote(true)
                          }
                        }}
                        className={cn(
                          'flex-1 rounded-[10px] border-[1.5px] px-2 py-2 text-xs font-bold',
                          active ? 'cursor-default' : 'cursor-pointer',
                          !active &&
                            'border-light-border bg-transparent text-dark-muted dark:border-dark-border',
                        )}
                        style={active ? tillganglighetToggleActiveStyle(r.color) : undefined}
                      >
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {showNote && pendingResponse && (
          <div className="fixed inset-0 z-50">
            <div
              className={tillganglighetSheetBackdrop}
              onClick={() => {
                setShowNote(false)
                setPendingResponse(null)
              }}
            />
            <div className={tillganglighetSheet}>
              <div className={tillganglighetSheetHandle} />
              <div className="mb-1 flex items-center gap-2 text-[15px] font-bold text-light-text dark:text-dark-text">
                {pendingResponse === 'yes' ? (
                  <>
                    <Check size={18} color="#1d9e75" /> Ja, jag spelar!
                  </>
                ) : pendingResponse === 'maybe' ? (
                  <>
                    <HelpCircle size={18} color="#f5c200" /> Kanske
                  </>
                ) : (
                  <>
                    <X size={18} color="#e24b4a" /> Kan inte
                  </>
                )}
              </div>
              <div className="mb-3.5 text-[13px] text-dark-muted">
                Vill du lagga till en kommentar? (valfritt)
              </div>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="T.ex. Kommer lite sent..."
                className={tillganglighetInput}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNote(false)
                    setPendingResponse(null)
                  }}
                  className={tillganglighetSheetCancel}
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={() => respond(pendingResponse, note)}
                  disabled={responding}
                  className={tillganglighetSheetSubmit(pendingResponse)}
                >
                  {responding ? 'Skickar...' : 'Skicka svar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {total > 0 && (
          <div>
            <div className={tillganglighetStatsSection}>LAGETS SVAR ({total})</div>
            <div className={tillganglighetStatsCard}>
              <div className="mb-2.5 flex gap-4">
                <div className="flex-1 text-center">
                  <div className={tillganglighetStatValue('yes')}>{yesGroup.length}</div>
                  <div className="text-[10px] text-dark-muted">Ja</div>
                </div>
                <div className="flex-1 text-center">
                  <div className={tillganglighetStatValue('maybe')}>{maybeGroup.length}</div>
                  <div className="text-[10px] text-dark-muted">Kanske</div>
                </div>
                <div className="flex-1 text-center">
                  <div className={tillganglighetStatValue('no')}>{noGroup.length}</div>
                  <div className="text-[10px] text-dark-muted">Nej</div>
                </div>
              </div>
              <div className={tillganglighetProgressTrack}>
                {yesGroup.length > 0 && (
                  <div className="bg-[#1d9e75]" style={tillganglighetProgressWidth((yesGroup.length / total) * 100)} />
                )}
                {maybeGroup.length > 0 && (
                  <div className="bg-gold" style={tillganglighetProgressWidth((maybeGroup.length / total) * 100)} />
                )}
                {noGroup.length > 0 && (
                  <div className="bg-[#e24b4a]" style={tillganglighetProgressWidth((noGroup.length / total) * 100)} />
                )}
              </div>
            </div>

            {(
              [
                { group: yesGroup, label: 'KAN SPELA', tone: 'yes' as const, headerClass: 'text-[#1d9e75]' },
                { group: maybeGroup, label: 'KANSKE', tone: 'maybe' as const, headerClass: 'text-gold' },
                { group: noGroup, label: 'KAN INTE', tone: 'no' as const, headerClass: 'text-[#e24b4a]' },
              ] as const
            )
              .filter(g => g.group.length > 0)
              .map(({ group, label, tone, headerClass }) => (
                <div key={label} className="mb-3">
                  <div className={cn('mb-1.5 text-[10px] font-bold tracking-wide', headerClass)}>
                    {label} ({group.length})
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.map(r => {
                      const p = profiles[r.user_id]
                      const name = p?.full_name || 'Lagmedlem'
                      const hue = nameHue(name)
                      const tc = `hsl(${hue},50%,45%)`
                      const tclo = `hsl(${hue},40%,15%)`
                      return (
                        <div key={r.user_id} className={tillganglighetMemberRow(tone)}>
                          {p?.avatar_url ? (
                            <img src={p.avatar_url} alt="" className={tillganglighetAvatarImg} />
                          ) : (
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold dark:bg-[hsl(var(--m-h),40%,15%)]"
                              style={tillganglighetMemberAvatarStyle(hue, tc, tclo)}
                            >
                              {name
                                .split(' ')
                                .map(w => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className={tillganglighetMemberName}>{name}</div>
                            {r.note && <div className={tillganglighetMemberNote}>{r.note}</div>}
                          </div>
                          <div>
                            {r.response === 'yes' ? (
                              <Check size={16} color="#1d9e75" />
                            ) : r.response === 'maybe' ? (
                              <HelpCircle size={16} color="#f5c200" />
                            ) : (
                              <X size={16} color="#e24b4a" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
