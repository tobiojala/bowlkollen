import { cn } from '@/lib/cn'

export const schemaPillClass = (active: boolean) =>
  cn(
    'shrink-0 cursor-pointer rounded-full border px-3 py-1 text-[11px] font-bold whitespace-nowrap',
    '[-webkit-tap-highlight-color:transparent]',
    active
      ? 'border-gold bg-gold text-[#1a1400]'
      : 'border-light-border bg-transparent text-dark-muted dark:border-dark-border',
  )

export const schemaGhostPillClass = cn(
  'shrink-0 cursor-pointer rounded-full border border-light-border bg-transparent px-2.5 py-1',
  'text-[11px] font-bold whitespace-nowrap text-dark-muted',
  '[-webkit-tap-highlight-color:transparent] dark:border-dark-border',
)

export const schemaDivider = 'h-4 w-px shrink-0 bg-light-border dark:bg-dark-border'

export const schemaSectionRule = 'flex flex-1 items-center gap-2.5 px-4 pt-3 pb-1'
