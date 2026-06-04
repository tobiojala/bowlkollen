import { cn } from '@/lib/cn'

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('animate-pulse rounded-md bg-black/7 dark:bg-white/7', className)} style={style} />
}

/** Team detail loading placeholder — hero, stats bar, match rows. */
export function TeamPageSkeleton() {
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <div className="mx-auto max-w-app">
        <div className="px-5 pb-5 pt-6">
          <Bone className="h-2.5 w-14 rounded-sm" />
          <div className="mt-5 flex items-center gap-4">
            <Bone className="h-[68px] w-[68px] shrink-0 rounded-2xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Bone className="h-[18px] w-[60%] rounded-md" />
              <Bone className="h-[11px] w-[40%] rounded" />
            </div>
          </div>
        </div>

        <div className="flex border-y border-black/7 dark:border-white/7">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3.5',
                i < 4 && 'border-r border-black/7 dark:border-white/7',
              )}
            >
              <Bone className="h-[18px] w-1/2 rounded" />
              <Bone className="h-2 w-[70%] rounded-sm" />
            </div>
          ))}
        </div>

        <div className="px-5">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 py-3.5',
                i < 4 && 'border-b border-black/7 dark:border-white/7',
              )}
            >
              <Bone className="h-7 w-7 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Bone className="h-3 rounded" style={{ width: `${50 + (i % 3) * 12}%` }} />
                <Bone className="h-2 w-[35%] rounded-sm" />
              </div>
              <Bone className="h-5 w-[52px] rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
