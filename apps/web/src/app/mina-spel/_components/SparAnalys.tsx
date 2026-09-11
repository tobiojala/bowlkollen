'use client'

import { COLOR, FONT } from '@/lib/brand'
import { usePlayerSpares } from './use-player-spares'

// Colour is a whisper: numbers stay white; a bar only tips gold/green/red when it
// clears/undershoots a cap. Matches the locked design language.
const ELITE = 85, TARGET = 70, FLOOR = 40
const HEX: Record<string, string> = { gold: '#f5c200', green: '#48d18a', red: '#e05555' }
const tip = (p: number): string | null => p >= ELITE ? 'gold' : p >= TARGET ? 'green' : p < FLOOR ? 'red' : null
const rgb = (h: string): [number, number, number] => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
function barFill(p: number): string {
  const k = tip(p)
  if (!k) return 'linear-gradient(90deg,rgba(244,245,247,.14),rgba(244,245,247,.55))'
  const [r, g, b] = rgb(HEX[k])
  return `linear-gradient(90deg,rgba(244,245,247,.14),rgba(244,245,247,.55) 72%,rgba(${r},${g},${b},.95) 100%)`
}

const Stat = ({ v, lbl, sub }: { v: string; lbl: string; sub?: string }) => (
  <div>
    <div style={{ fontFamily: FONT.score, fontWeight: 800, fontSize: 40, letterSpacing: '-.035em', lineHeight: .95 }}>{v}</div>
    <div style={{ fontSize: 11, color: COLOR.ink3, textTransform: 'uppercase', letterSpacing: '.09em', fontWeight: 700, marginTop: 9 }}>{lbl}</div>
    {sub && <div style={{ fontSize: 12, color: COLOR.ink4, marginTop: 3 }}>{sub}</div>}
  </div>
)

export function SparAnalys() {
  const { stats, total } = usePlayerSpares()
  if (total === 0) return (
    <div style={{ padding: '40px 4px', color: COLOR.ink3, fontSize: 15, maxWidth: '46ch' }}>
      Inga lämningar loggade än. Logga ett spel och pricka käglorna som stod på de öppna rutorna — din spärranalys byggs upp här, läge för läge.
    </div>
  )
  const { overall, byKind, byLeave, nemesis } = stats
  const rule = <div style={{ height: 1, background: COLOR.hairline, margin: '26px 0' }} />

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 8, alignItems: 'end' }}>
        <Stat v={`${overall.pct}%`} lbl="Spärr totalt" sub={`${overall.made} / ${overall.att} lägen`} />
        <Stat v={`${byKind.single.pct}%`} lbl="Enkelkäglor" />
        <Stat v={`${byKind.hal.att ? byKind.hal.pct : 0}%`} lbl="Hål" />
      </div>

      {rule}
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.02em', textTransform: 'uppercase', marginBottom: 6 }}>Läge för läge</div>
      <div>
        {byLeave.map(l => (
          <div key={l.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 14px', alignItems: 'center', padding: '13px 0', borderTop: `1px solid ${COLOR.hairline}` }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{l.name}{l.kind === 'hal' ? ' · hål' : ''}</div>
            <div style={{ fontFamily: FONT.score, fontWeight: 800, fontSize: 19, textAlign: 'right' }}>{l.pct}<span style={{ fontSize: 11, color: COLOR.ink4 }}>%</span></div>
            <div style={{ fontSize: 12, color: COLOR.ink4, gridColumn: 1 }}>{l.made}/{l.att} lägen</div>
            <div style={{ gridColumn: '1 / -1', height: 4, borderRadius: 3, background: 'rgba(244,245,247,.06)', overflow: 'hidden', marginTop: 3 }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${l.pct}%`, background: barFill(l.pct) }} />
            </div>
          </div>
        ))}
      </div>

      {nemesis && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLOR.hairline}` }}>
          <div style={{ fontFamily: FONT.score, fontWeight: 800, fontSize: 28, color: COLOR.red, flexShrink: 0 }}>{nemesis.pct}%</div>
          <div style={{ fontSize: 13, color: COLOR.ink2 }}>Din <b style={{ color: COLOR.ink, fontWeight: 600 }}>nemesis</b>: {nemesis.name}. Satt <b style={{ color: COLOR.ink, fontWeight: 600 }}>{nemesis.made}</b> av <b style={{ color: COLOR.ink, fontWeight: 600 }}>{nemesis.att}</b>.</div>
        </div>
      )}

      <div style={{ marginTop: 28, borderTop: `1px solid ${COLOR.hairline}`, paddingTop: 16, fontSize: 13, color: COLOR.ink3, maxWidth: '56ch' }}>
        Byggt från dina egna loggade spel — funkar i varje hall. Logga fler serier så blir mönstret skarpare.
      </div>
    </div>
  )
}
