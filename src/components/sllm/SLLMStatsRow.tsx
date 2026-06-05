'use client'

import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'

type Props = {
  loading: boolean
  total: number
  swedish: number
  nations: number
}

export function SLLMStatsRow({ loading, total, swedish, nations }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const stats = [
    ['Anmälda', loading ? '—' : total],
    ['Svenska', loading ? '—' : swedish],
    ['Nationer', loading ? '—' : nations],
  ] as const

  return (
    <div className="grid grid-cols-3 gap-2.5 px-4 pt-3.5 pb-5">
      {stats.map(([label, value]) => (
        <div
          key={label}
          className={cn(
            'rounded-xl border border-light-border px-2.5 py-3.5 text-center dark:border-dark-border',
            dark ? 'bg-white/[0.04]' : 'bg-black/[0.02]',
          )}
        >
          <div className="text-[28px] leading-none font-black text-gold">{value}</div>
          <div className="mt-1.5 text-[9px] font-bold tracking-wide text-dark-muted uppercase">
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
