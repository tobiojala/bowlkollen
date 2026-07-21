'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useSession, useVerifiedTeamMembers, useTransferCaptain } from '@/lib/queries'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'

const COL = 'max(0px, calc(50vw - 300px))'

type Props = { open: boolean; onClose: () => void; bitsTeamId: number }

/** The "svenska lag" hand-off — the current captain picks another verified
 * teammate to take over. The only way captaincy changes hands after the
 * founding claim (see transfer_captain in invite_scoped_claims.sql). */
export function CaptainTransferSheet({ open, onClose, bitsTeamId }: Props) {
  const { data: session }         = useSession()
  const { data: members = [] }    = useVerifiedTeamMembers(bitsTeamId)
  const { mutate, isPending }     = useTransferCaptain(bitsTeamId)

  const others = members.filter(m => m.userId !== session?.user.id)

  const transfer = (toUserId: string) => {
    mutate(toUserId, { onSuccess: onClose })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              position: 'fixed', bottom: 0, left: COL, right: COL, zIndex: 61, maxHeight: '70vh',
              background: COLOR.surface, borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
              boxShadow: '0 -12px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: COLOR.ink }}>Föra över kaptensrollen</span>
              <button onClick={onClose} aria-label="Stäng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <X size={20} color={COLOR.ink3} />
              </button>
            </div>
            <div style={{ padding: `0 ${SPACE[4]}px ${SPACE[2]}px`, fontSize: TYPE.caption, color: COLOR.ink3 }}>
              Du blir spelare igen — den du väljer blir ny kapten direkt.
            </div>
            <div style={{ overflowY: 'auto', padding: `0 ${SPACE[4]}px ${SPACE[6]}px` }}>
              {others.length === 0 && (
                <div style={{ padding: `${SPACE[6]}px 0`, textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body }}>
                  Inga andra verifierade lagmedlemmar än.
                </div>
              )}
              {others.map(m => (
                <button
                  key={m.userId}
                  onClick={() => transfer(m.userId)}
                  disabled={isPending}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%',
                    padding: `${SPACE[3]}px 0`, borderTop: `1px solid ${COLOR.hairline}`,
                    background: 'none', border: 'none', borderTopWidth: 1, textAlign: 'left',
                    cursor: isPending ? 'default' : 'pointer', opacity: isPending ? 0.6 : 1,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ flex: 1, fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink }}>{m.displayName}</span>
                  <span style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{m.role === 'captain' ? 'Kapten' : ''}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
