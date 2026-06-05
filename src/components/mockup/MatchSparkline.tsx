export default function MatchSparkline({ games }: { games: number[] }) {
  const W = 38, H = 16
  const mn = Math.min(...games), mx = Math.max(...games), range = mx - mn || 1
  const pts = games.map((g, i) => ({
    x: (i / (games.length - 1)) * (W - 4) + 2,
    y: (H - 4) - ((g - mn) / range) * (H - 4) + 2,
  }))
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const trend = games[games.length - 1] - games[0]
  const c = trend > 15 ? '#5dcaa5' : trend < -15 ? '#e05555' : '#f5c200'
  return (
    <svg width={W} height={H} style={{ display: 'block', flexShrink: 0, opacity: 0.8 }}>
      <path d={d} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 2.5 : 1.5}
          fill={c} opacity={i === pts.length - 1 ? 1 : 0.6} />
      ))}
    </svg>
  )
}
