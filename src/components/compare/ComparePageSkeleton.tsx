'use client'

import { motion } from 'framer-motion'

type Props = { label?: string }

export function ComparePageSkeleton({ label = 'Laddar...' }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="text-[13px] text-dark-muted"
      >
        {label}
      </motion.div>
    </main>
  )
}
