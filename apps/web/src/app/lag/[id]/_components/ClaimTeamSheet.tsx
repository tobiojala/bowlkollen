'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, Clock } from 'lucide-react'
import { useSubmitTeamClaim } from '@/lib/queries'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'

const COL = 'max(0px, calc(50vw - 300px))'

type Props = {
  open:       boolean
  onClose:    () => void
  teamId:     number
  teamName:   string
  /** A team_claim/new_team_bootstrap invite code, if the user arrived via a
   * scoped share link — marks the claim vouched (see submit_team_claim). */
  inviteCode?: string
}

export function ClaimTeamSheet({ open, onClose, teamId, teamName, inviteCode }: Props) {
  const [lic,    setLic]    = useState('')
  const [result, setResult] = useState<'verified' | 'pending' | null>(null)
  const { mutate, isPending, error } = useSubmitTeamClaim(teamId)

  const submit = () => {
    if (!lic.trim() || isPending) return
    mutate({ licNbr: lic.trim(), inviteCode }, { onSuccess: status => setResult(status) })
  }

  const close = () => { setLic(''); setResult(null); onClose() }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={close}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              position: 'fixed', bottom: 0, left: COL, right: COL, zIndex: 61,
              background: COLOR.surface, borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
              boxShadow: '0 -12px 48px rgba(0,0,0,0.5)', padding: `0 ${SPACE[4]}px ${SPACE[8]}px`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: `${SPACE[3]}px 0` }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: COLOR.ink4, opacity: 0.5 }} />
            </div>

            {result ? (
              // ── Result ──────────────────────────────────────────────────
              <div style={{ textAlign: 'center', padding: `${SPACE[4]}px 0 0` }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: result === 'verified' ? `${COLOR.gold}18` : `${COLOR.ink2}14`,
                }}>
                  {result === 'verified'
                    ? <ShieldCheck size={26} color={COLOR.gold} />
                    : <Clock size={26} color={COLOR.ink2} />}
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: COLOR.ink, margin: `${SPACE[4]}px 0 ${SPACE[2]}px` }}>
                  {result === 'verified' ? 'Du är nu med i laget' : 'Skickat för granskning'}
                </div>
                <div style={{ fontSize: 14, color: COLOR.ink2, lineHeight: 1.55, maxWidth: 340, margin: '0 auto' }}>
                  {result === 'verified'
                    ? `Välkommen till ${teamName}. Välj din roll i laget uppe på sidan — kaptenen är den som sätter laguppställningen.`
                    : `Vi verifierar att du tillhör ${teamName} och hör av oss. Det tar oftast inte lång tid.`}
                </div>
                <button onClick={close} style={{
                  marginTop: SPACE[6], width: '100%', padding: `${SPACE[3]}px`, borderRadius: RADIUS.lg,
                  background: COLOR.gold, border: 'none', color: '#1a1400', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                }}>
                  Klart
                </button>
              </div>
            ) : (
              // ── Form ────────────────────────────────────────────────────
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACE[2], marginBottom: SPACE[2] }}>
                  <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: COLOR.ink }}>Gå med i laget</span>
                  <button onClick={close} aria-label="Stäng" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    <X size={20} color={COLOR.ink3} />
                  </button>
                </div>
                <div style={{ fontSize: 14, color: COLOR.ink2, lineHeight: 1.55, marginBottom: SPACE[4] }}>
                  Ange ditt <strong style={{ color: COLOR.ink }}>licensnummer</strong> så verifierar vi att du tillhör
                  {' '}{teamName}. Spelar du i laget blir du medlem direkt.
                </div>

                <input
                  value={lic}
                  onChange={e => setLic(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  placeholder="Licensnummer"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: `${SPACE[3]}px ${SPACE[4]}px`, borderRadius: RADIUS.lg,
                    background: COLOR.bg, border: `1px solid ${COLOR.hairline}`,
                    fontSize: 16, color: COLOR.ink, outline: 'none',
                  }}
                />
                {error && (
                  <div style={{ fontSize: 13, color: COLOR.red, marginTop: SPACE[2] }}>
                    Något gick fel — försök igen.
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={!lic.trim() || isPending}
                  style={{
                    marginTop: SPACE[4], width: '100%', padding: `${SPACE[3]}px`, borderRadius: RADIUS.lg,
                    background: COLOR.gold, border: 'none', color: '#1a1400', fontSize: 15, fontWeight: 800,
                    cursor: !lic.trim() || isPending ? 'default' : 'pointer', opacity: !lic.trim() || isPending ? 0.6 : 1,
                  }}
                >
                  {isPending ? 'Verifierar…' : 'Gå med i laget'}
                </button>
                <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, textAlign: 'center', marginTop: SPACE[3] }}>
                  Ditt licensnummer används bara för att verifiera dig.
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
