'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePendingAvatars, useModerateAvatar } from '@/lib/avatars'
import { COLOR, RADIUS, SPACE } from '@/lib/brand'

// Admin review queue for player profile photos. The /admin layout already gates
// on is_admin(); the RPCs re-check server-side. Approve = shows everywhere.
export default function AdminAvatarsPage() {
  const { data: pending = [], isLoading } = usePendingAvatars()
  const moderate = useModerateAvatar()

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 80px' }}>
        <Link href="/admin" style={{ fontSize: 13, color: COLOR.ink3, textDecoration: 'none' }}>← Admin</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: '10px 0 4px' }}>Profilbilder</h1>
        <div style={{ fontSize: 14, color: COLOR.ink3, marginBottom: SPACE[6] }}>
          {isLoading ? 'Laddar…' : pending.length === 0 ? 'Inga bilder att granska.' : `${pending.length} väntar på granskning`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
          {pending.map((p) => (
            <div key={p.public_id} style={{ display: 'flex', alignItems: 'center', gap: SPACE[4],
              background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] }}>
              <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: COLOR.surface2 }}>
                <Image src={p.avatar_url} alt={p.player_name} fill sizes="64px" style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700 }}>{p.player_name}</div>
              <div style={{ display: 'flex', gap: SPACE[2] }}>
                <button onClick={() => moderate.mutate({ publicId: p.public_id, decision: 'rejected' })} disabled={moderate.isPending}
                  style={{ padding: '9px 14px', borderRadius: 999, border: `1px solid ${COLOR.hairline}`, background: 'transparent', color: COLOR.ink2, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Neka
                </button>
                <button onClick={() => moderate.mutate({ publicId: p.public_id, decision: 'approved' })} disabled={moderate.isPending}
                  style={{ padding: '9px 16px', borderRadius: 999, border: 'none', background: COLOR.gold, color: '#151005', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Godkänn
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
