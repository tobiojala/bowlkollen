import { playerSparkBarStyle, scoreGameColor } from '@/lib/player-ui'

export function PlayerSparkline({ games }: { games: number[] }) {
  const last = games.slice(-10)
  if (last.length < 2) return null

  return (
    <div className="flex h-8 items-end gap-[3px]">
      {last.map((g, i) => {
        const h = Math.max(4, Math.round(((g - 80) / 220) * 28))
        return (
          <div
            key={i}
            className="min-w-2 flex-1 rounded-sm"
            style={playerSparkBarStyle(h, scoreGameColor(g))}
            title={String(g)}
          />
        )
      })}
    </div>
  )
}
