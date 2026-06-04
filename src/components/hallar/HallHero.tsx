'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, CalendarCheck, Monitor } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { hallHeroGradient, type HallDetail } from '@/lib/hall-ui'

type Props = {
  hall: HallDetail
  onBack: () => void
}

export function HallHero({ hall, onBack }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className="relative pb-6" style={{ background: hallHeroGradient(dark) }}>
      <button
        type="button"
        onClick={onBack}
        className={cn(
          'absolute top-[52px] left-4 flex cursor-pointer items-center gap-1.5 rounded-[20px] border-none py-2 pr-3.5 pl-2.5 text-sm font-semibold',
          'text-light-text [-webkit-tap-highlight-color:transparent] dark:text-dark-text',
          dark ? 'bg-white/[0.07]' : 'bg-black/[0.06]',
        )}
      >
        <ArrowLeft size={16} />
        Tillbaka
      </button>

      <div className="px-5 pt-[108px]">
        {hall.region && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2.5 inline-block rounded-[20px] border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gold uppercase"
          >
            {hall.region}
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="m-0 text-[28px] leading-[1.1] font-black tracking-tight"
        >
          {hall.name}
        </motion.h1>

        {hall.city && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-1.5 flex items-center gap-1.5 text-sm text-dark-muted"
          >
            <MapPin size={13} />
            {hall.city}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 flex flex-wrap gap-2"
        >
          {hall.lanes != null && hall.lanes > 0 && (
            <div
              className={cn(
                'rounded-xl border px-3.5 py-2 text-[13px] font-bold',
                'border-light-border dark:border-dark-border',
                dark ? 'bg-white/[0.07]' : 'bg-black/[0.05]',
              )}
            >
              {hall.lanes} banor
            </div>
          )}
          {hall.online_booking && (
            <a
              href={hall.online_booking_url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-[#5a82b4]/30 bg-[#5a82b4]/[0.13] px-3.5 py-2 text-[13px] font-bold text-[#5a82b4] no-underline"
            >
              <CalendarCheck size={13} />
              Online-bokning
            </a>
          )}
          {hall.online_scoring && (
            <a
              href={hall.online_scoring_url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2 text-[13px] font-bold text-gold no-underline"
            >
              <Monitor size={13} />
              Online-scoring
            </a>
          )}
          {hall.accepts_gift_cards && (
            <div
              className={cn(
                'rounded-xl border px-3.5 py-2 text-[13px] font-bold',
                'border-light-border dark:border-dark-border',
                dark ? 'bg-white/[0.07]' : 'bg-black/[0.05]',
              )}
            >
              Presentkort
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
