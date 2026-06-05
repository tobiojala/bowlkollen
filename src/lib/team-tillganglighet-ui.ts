import { cn } from '@/lib/cn'

export const tillganglighetPageRoot = cn(
  'font-sans text-light-text dark:text-dark-text',
)

export const tillganglighetHeader = cn(
  'border-b border-light-border px-5 pb-3.5 pt-4',
  'bg-[#e8f0f8] dark:border-dark-border dark:bg-[#0d1a2e]',
)

export const tillganglighetBackLink = cn(
  'mb-3 flex items-center gap-1 text-xs text-dark-muted no-underline',
)

export const tillganglighetEyebrow = cn(
  'mb-1 text-[11px] font-bold tracking-widest text-dark-muted',
)

export const tillganglighetTitle = 'text-lg font-extrabold text-light-text dark:text-dark-text'

export const tillganglighetMeta = 'mt-0.5 text-xs text-dark-muted'

export const tillganglighetMain = 'mx-auto max-w-[500px] px-5 pb-12 pt-5'

export const tillganglighetCard = cn(
  'mb-5 overflow-hidden rounded-[20px] border border-light-border',
  'bg-light-card dark:border-dark-border dark:bg-dark-card',
)

export const tillganglighetHero = cn(
  'px-5 pb-4 pt-5 text-center',
  'bg-gradient-to-br from-[#e8f0f8] to-[#d0e0f0]',
  'dark:from-[#0d1a2e] dark:to-[#1a2840]',
)

export const tillganglighetQuestion = 'mb-1 text-[22px] font-black text-light-text dark:text-dark-text'

export const tillganglighetCardBody = 'px-4 pb-5 pt-4'

export const tillganglighetResponseBtn = cn(
  'flex w-full cursor-pointer items-center gap-3.5 rounded-[14px] border-2 px-[18px] py-4 text-left',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

export const tillganglighetYesBtn = cn(
  tillganglighetResponseBtn,
  'border-[#1d9e75] bg-[rgba(29,158,117,0.12)]',
)

export const tillganglighetMaybeBtn = cn(
  tillganglighetResponseBtn,
  'border-[#c9960a] bg-[rgba(245,194,0,0.12)]',
)

export const tillganglighetNoBtn = cn(
  tillganglighetResponseBtn,
  'border-[#e24b4a] bg-[rgba(226,75,74,0.12)]',
)

export const tillganglighetYesLabel = 'text-[15px] font-bold text-[#1d9e75]'
export const tillganglighetMaybeLabel = 'text-[15px] font-bold text-gold'
export const tillganglighetNoLabel = 'text-[15px] font-bold text-[#e24b4a]'

export function tillganglighetSelectedPanel(response: string) {
  return cn(
    'mb-3 rounded-[14px] border-2 p-4 text-center',
    response === 'yes' && 'border-[#1d9e75] bg-[rgba(29,158,117,0.12)]',
    response === 'maybe' && 'border-[#c9960a] bg-[rgba(245,194,0,0.12)]',
    response === 'no' && 'border-[#e24b4a] bg-[rgba(226,75,74,0.12)]',
  )
}

export function tillganglighetSelectedTitle(response: string) {
  return cn(
    'mb-1 text-base font-extrabold',
    response === 'yes' && 'text-[#1d9e75]',
    response === 'maybe' && 'text-gold',
    response === 'no' && 'text-[#e24b4a]',
  )
}

export function tillganglighetToggleBtn(active: boolean, color: string) {
  return cn(
    'flex-1 rounded-[10px] border-[1.5px] px-2 py-2 text-xs font-bold',
    active ? 'cursor-default' : 'cursor-pointer',
    !active && 'border-light-border bg-transparent text-dark-muted dark:border-dark-border',
  )
}

export const tillganglighetSheetBackdrop = 'absolute inset-0 bg-black/50'

export const tillganglighetSheet = cn(
  'absolute inset-x-0 bottom-0 rounded-t-[20px] border border-light-border px-5 pb-9 pt-5',
  'bg-light-card dark:border-dark-border dark:bg-dark-card',
)

export const tillganglighetSheetHandle = cn(
  'mx-auto mb-4 h-1 w-9 rounded-sm bg-light-border dark:bg-dark-border',
)

export const tillganglighetInput = cn(
  'mb-3 box-border w-full rounded-[10px] border border-light-border px-3.5 py-[11px] text-[13px] outline-none',
  'bg-[#f0f4f8] text-light-text dark:border-dark-border dark:bg-[#1c2840] dark:text-dark-text',
)

export const tillganglighetSheetCancel = cn(
  'flex-1 cursor-pointer rounded-[10px] border border-light-border bg-transparent px-3 py-3 text-[13px] font-semibold text-dark-muted',
  'dark:border-dark-border',
)

export function tillganglighetSheetSubmit(response: string) {
  return cn(
    'flex-[2] cursor-pointer rounded-[10px] border-none px-3 py-3 text-[13px] font-extrabold',
    response === 'yes' && 'bg-[#1d9e75] text-white',
    response === 'maybe' && 'bg-gold text-[#1a1400]',
    response === 'no' && 'bg-[#e24b4a] text-white',
  )
}

export const tillganglighetStatsSection = 'mb-3 text-[10px] font-extrabold tracking-[2px] text-dark-muted'

export const tillganglighetStatsCard = cn(
  'mb-4 rounded-[14px] border border-light-border px-4 py-3.5',
  'bg-light-card dark:border-dark-border dark:bg-dark-card',
)

export const tillganglighetStatValue = (tone: 'yes' | 'maybe' | 'no') =>
  cn(
    'text-2xl font-black',
    tone === 'yes' && 'text-[#1d9e75]',
    tone === 'maybe' && 'text-gold',
    tone === 'no' && 'text-[#e24b4a]',
  )

export const tillganglighetProgressTrack = cn(
  'flex h-1.5 overflow-hidden rounded-sm bg-light-border dark:bg-dark-border',
)

export function tillganglighetGroupHeader(color: string) {
  return cn('mb-1.5 text-[10px] font-bold tracking-wide', `text-[${color}]`)
}

export function tillganglighetMemberRow(group: 'yes' | 'maybe' | 'no') {
  return cn(
    'flex items-center gap-2.5 rounded-[10px] border px-3 py-2',
    group === 'yes' &&
      'border-[#1d9e75]/20 bg-[rgba(29,158,117,0.05)] dark:bg-[rgba(29,158,117,0.08)]',
    group === 'maybe' &&
      'border-gold/20 bg-[rgba(245,194,0,0.05)] dark:bg-[rgba(245,194,0,0.08)]',
    group === 'no' &&
      'border-[#e24b4a]/20 bg-[rgba(226,75,74,0.05)] dark:bg-[rgba(226,75,74,0.08)]',
  )
}

export const tillganglighetMemberName = 'text-[13px] font-semibold text-light-text dark:text-dark-text'

export const tillganglighetMemberNote = 'mt-px text-[11px] italic text-dark-muted'

export const tillganglighetAvatarImg = 'h-7 w-7 shrink-0 rounded-full object-cover'
