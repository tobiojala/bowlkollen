import { cn } from '@/lib/cn'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className, children, ...props }: Props) {
  return (
    <button
      type="button"
      className={cn(
        'cursor-pointer rounded-lg text-sm font-bold transition-opacity disabled:opacity-50',
        variant === 'primary' && 'bg-gold px-4 py-2.5 text-[#1a1400]',
        variant === 'ghost' &&
          'border border-light-border bg-transparent px-4 py-2.5 text-dark-muted dark:border-dark-border',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
