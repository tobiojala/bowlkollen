'use client'

import { useRef, useState } from 'react'
import { useUploadMyAvatar } from '@/lib/avatars'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { COLOR } from '@/lib/brand'

// Owner sets their player profile photo. Uploads to the avatars bucket and puts
// the claim into review — the photo shows everywhere once an admin approves it.
export function AvatarUpload({ publicId, name }: { publicId: string; name: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const upload = useUploadMyAvatar()
  const [msg, setMsg] = useState<string | null>(null)

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setMsg(null)
    upload.mutate(f, {
      onSuccess: () => setMsg('Bild uppladdad — väntar på granskning.'),
      onError: () => setMsg('Kunde inte ladda upp bilden. Försök igen.'),
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
      <PlayerAvatar publicId={publicId} name={name} size={56} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <button onClick={() => ref.current?.click()} disabled={upload.isPending}
          style={{ padding: '9px 16px', borderRadius: 999, border: `1px solid ${COLOR.hairline}`,
            background: 'transparent', color: COLOR.ink, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {upload.isPending ? 'Laddar upp…' : 'Byt profilbild'}
        </button>
        <div style={{ fontSize: 13, color: COLOR.ink3, marginTop: 6, lineHeight: 1.4 }}>
          {msg ?? 'Din bild granskas innan den visas publikt.'}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} />
    </div>
  )
}
