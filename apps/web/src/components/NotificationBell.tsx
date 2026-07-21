'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useColors } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import { useNotifications } from '@/lib/queries'

const EVENT_ICON: Record<string, string> = {
  match_result:     '⚽',
  win_streak:       '🔥',
  personal_best:    '🏆',
  player_milestone: '⭐',
  captain_post:     '💬',
  lineup_announced: '📋',
  revenge_win:      '⚡',
  giant_killer:     '🏆',
  division_climbed: '📈',
  promotion_clinched:'🎉',
}

export default function NotificationBell() {
  const { C, isDark } = useColors()
  const { data: notifications = [], refetch } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref  = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read_at)
  const count  = unread.length

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    if (!unread.length) return
    const supabase = createClient()
    const ids = unread.map(n => n.id)
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
    refetch()
  }

  const openPanel = () => {
    setOpen(v => !v)
    if (!open && unread.length) markAllRead()
  }

  if (!notifications.length && !count) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={openPanel}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          background: open ? C.accent + '18' : 'transparent',
          border: 'none', cursor: 'pointer',
        }}
      >
        <Bell size={18} color={count > 0 ? C.accent : C.muted} strokeWidth={count > 0 ? 2.5 : 1.8} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: C.accent, border: '2px solid ' + C.bg,
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, width: 300,
          background: C.card, border: '1px solid ' + C.border,
          borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px', borderBottom: '1px solid ' + C.border }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 1 }}>NOTISER</span>
            {notifications.length > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Markera alla
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: C.muted }}>
                Inga notiser än
              </div>
            ) : (
              notifications.slice(0, 20).map(n => {
                const isUnread = !n.read_at
                const timeStr  = new Date(n.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
                const icon     = EVENT_ICON[n.event_type] ?? '📣'
                return (
                  <Link
                    key={n.id}
                    href={`/teams/${n.team_id}`}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px 16px',
                      background: isUnread ? C.accent + '08' : 'transparent',
                      borderBottom: '1px solid ' + C.border,
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: isUnread ? 700 : 500,
                        color: C.text, overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{timeStr}</div>
                    </div>
                    {isUnread && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, flexShrink: 0, marginTop: 4 }} />
                    )}
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
