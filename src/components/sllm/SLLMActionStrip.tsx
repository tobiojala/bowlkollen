'use client'

import { cn } from '@/lib/cn'
import { SLLM_EVENT } from '@/lib/sllm-data'

export function SLLMActionStrip() {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pt-3.5 [scrollbar-width:none]">
      {SLLM_EVENT.actions.map(a => {
        const isPrimary = a.style === 'primary'
        const isLiveLink = a.style === 'live'

        return (
          <a
            key={a.href}
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'shrink-0 rounded-[10px] px-[18px] py-2 text-xs font-bold no-underline',
              '[-webkit-tap-highlight-color:transparent]',
              isPrimary && 'bg-gold text-[#1a1400]',
              isLiveLink &&
                'border border-red/30 text-red dark:bg-red/10 bg-red/[0.08]',
              !isPrimary &&
                !isLiveLink &&
                'border border-light-border text-light-text dark:border-dark-border dark:text-dark-text',
            )}
          >
            {a.label}
          </a>
        )
      })}
    </div>
  )
}
