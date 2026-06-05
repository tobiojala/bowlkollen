'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui'
import { HALL_SPRING } from '@/lib/hall-ui'

type Props = {
  title: string
  delay: number
  children: ReactNode
}

export function HallInfoSection({ title, delay, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...HALL_SPRING, delay }}
    >
      <Card className="px-4 py-1">
        <div className="pt-3.5 pb-1 text-[11px] font-bold tracking-wide text-dark-muted uppercase">
          {title}
        </div>
        {children}
      </Card>
    </motion.div>
  )
}
