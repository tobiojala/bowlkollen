import { dark } from '@/lib/colors'
import { shortDiv } from '@/app/home/helpers'

type MyPlayer = {
  name: string; team: string; teamId: string; division: string
  average: number; lastScores: number[]; teamRank: number
}

export default function MyProfile({ myPlayer, C, isDark }: {
  myPlayer: MyPlayer; C: typeof dark; isDark: boolean
}) {
  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${isDark ? 'rgba(56,160,136,0.28)' : 'rgba(56,160,136,0.32)'}`,
        background: isDark
          ? 'linear-gradient(145deg, rgba(56,160,136,0.1) 0%, rgba(11,21,40,0.98) 100%)'
          : 'linear-gradient(145deg, rgba(56,160,136,0.06) 0%, rgba(248,248,252,1) 100%)' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #38a088, rgba(56,160,136,0.15))' }} />
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#38a088', letterSpacing: 1.4, flex: 1 }}>MIN PROFIL</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted,
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>Säsong 2026</span>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{myPlayer.name}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
              {myPlayer.team} · {shortDiv(myPlayer.division)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 0.8, marginBottom: 4 }}>SNITT</div>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: '#38a088',
                fontVariantNumeric: 'tabular-nums' }}>{myPlayer.average}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 }}>SENASTE 5</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
                {myPlayer.lastScores.map((score, i) => {
                  const pct   = (score - 150) / (300 - 150)
                  const barH  = Math.round(4 + pct * 36)
                  const isHigh  = score >= 220
                  const isAbove = score >= myPlayer.average
                  const barClr  = isHigh ? '#f5c200' : isAbove ? '#38a088' : C.textMuted
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 28, display: 'flex', alignItems: 'flex-end', height: 40 }}>
                        <div style={{ width: '100%', height: barH, borderRadius: 4, background: barClr,
                          opacity: i === myPlayer.lastScores.length - 1 ? 1 : 0.7 }} />
                      </div>
                      <span style={{ fontSize: 9, color: barClr, fontWeight: isHigh ? 800 : 500,
                        fontVariantNumeric: 'tabular-nums' }}>{score}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
