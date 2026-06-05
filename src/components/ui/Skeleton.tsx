import { cn } from '@/lib/cn'

// ── Base block ────────────────────────────────────────────────────────────
// Every skeleton shape is built from this. Pass Tailwind classes for size/shape.
//
// Usage:
//   <Sk className="h-5 w-32" />                     — text-like bar
//   <Sk className="size-12 rounded-full" />          — avatar circle
//   <Sk className="h-40 w-full rounded-2xl" />       — card block
export function Sk({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton bg-white/[0.07]', className)} />
  )
}

// ── Text lines ────────────────────────────────────────────────────────────
// Renders n lines of progressively shorter width — mimics a paragraph.
export function SkText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ['w-full', 'w-5/6', 'w-3/4', 'w-2/3', 'w-1/2']
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Sk key={i} className={cn('h-3', widths[i] ?? 'w-1/2')} />
      ))}
    </div>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────
// A horizontal skeleton row — icon + text bar. Good for list items.
export function SkRow({ icon = true, className }: { icon?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-2', className)}>
      {icon && <Sk className="size-8 rounded-full shrink-0" />}
      <div className="flex-1 flex flex-col gap-1.5">
        <Sk className="h-3.5 w-40" />
        <Sk className="h-2.5 w-24" />
      </div>
      <Sk className="h-5 w-14 shrink-0" />
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
// Full card skeleton with optional header bar.
export function SkCard({ header = true, lines = 3, className }: {
  header?: boolean; lines?: number; className?: string
}) {
  return (
    <div className={cn('rounded-2xl overflow-hidden border border-white/[0.08]', className)}>
      {header && <div className="h-0.5 skeleton bg-white/[0.07]" />}
      <div className="p-4 flex flex-col gap-3">
        <Sk className="h-4 w-32" />
        <SkText lines={lines} />
      </div>
    </div>
  )
}

// ── Match row ─────────────────────────────────────────────────────────────
// Mimics the shape of a completed match row in the match log.
export function SkMatchRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-3', className)}>
      <Sk className="w-1 h-8 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 ml-1">
        <Sk className="h-3 w-32" />
        <Sk className="h-2.5 w-48" />
      </div>
      <Sk className="h-7 w-14 rounded-lg shrink-0" />
    </div>
  )
}

// ── Score hero ────────────────────────────────────────────────────────────
// Mimics a match score header (team A — score — team B).
export function SkScoreHero({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-5', className)}>
      <div className="flex-1 flex flex-col items-end gap-2">
        <Sk className="h-4 w-28" />
        <Sk className="h-3 w-16" />
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Sk className="h-10 w-20 rounded-xl" />
        <Sk className="h-2.5 w-12" />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <Sk className="h-4 w-28" />
        <Sk className="h-3 w-16" />
      </div>
    </div>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────
// A generic full-page loading wrapper — just a padded column of blocks.
// Use when you don't have a more specific skeleton.
export function SkPage({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <main className={cn(
      'min-h-screen bg-dark-bg font-sans pb-20',
      '[&_.skeleton]:animate-[skeleton-pulse_1.6s_ease-in-out_infinite]',
      className,
    )}>
      <div className="max-w-[600px] mx-auto">
        {children}
      </div>
    </main>
  )
}
