import { cn } from '@/lib/cn'

export function teamInternRoleLabel(role: string) {
  if (role === 'captain') return 'Kapten'
  if (role === 'admin') return 'Admin'
  if (role === 'board') return 'Styrelse'
  return 'Spelare'
}

export function teamInternRoleBadgeClass(role: string) {
  if (role === 'captain' || role === 'admin') {
    return 'text-gold bg-gold/13'
  }
  if (role === 'board') {
    return 'text-[#3d6090] bg-[#3d6090]/13 dark:text-[#5a82b4] dark:bg-[#5a82b4]/13'
  }
  return 'text-dark-muted bg-dark-muted/10'
}

export const teamInternTextareaClass = cn(
  'mb-2 box-border w-full resize-y rounded-[10px] border border-light-border bg-light-card px-3 py-2.5',
  'font-sans text-[13px] outline-none text-light-text',
  'dark:border-dark-border dark:bg-dark-card dark:text-dark-text',
)

export const teamInternSelectClass = cn(
  'cursor-pointer rounded-md border border-light-border bg-light-card px-2 py-1 text-[11px]',
  'text-light-text dark:border-dark-border dark:bg-dark-card dark:text-dark-text',
)
