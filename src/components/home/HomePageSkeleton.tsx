import { cn } from '@/lib/cn'

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('animate-pulse rounded-md bg-black/7 dark:bg-white/7', className)} style={style} />
}

/** Home feed loading placeholder — mirrors hero, honor roll, table, match rows. */
export function HomePageSkeleton() {
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <div className="mx-auto max-w-app space-y-7 pb-12">
        <div className="px-4 pt-3">
          <div className="overflow-hidden rounded-2xl border border-[#5a82b4]/20 dark:border-[#5a82b4]/15">
            <Bone className="h-[3px] w-full rounded-none" />
            <div className="flex flex-col gap-3 p-3.5">
              <div className="flex items-center gap-2">
                <Bone className="h-2.5 w-28" />
                <Bone className="ml-auto h-[18px] w-12 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 flex-col items-end gap-1.5">
                  <Bone className="h-3.5 w-[70%]" />
                  <Bone className="h-2 w-9" />
                </div>
                <Bone className="h-9 w-14 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Bone className="h-3.5 w-[70%]" />
                  <Bone className="h-2 w-9" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4">
          <div className="overflow-hidden rounded-2xl border border-light-border dark:border-dark-border">
            <Bone className="h-[3px] w-full rounded-none" />
            <div className="flex flex-col gap-3.5 p-4">
              <Bone className="h-2.5 w-20" />
              <div className="flex items-center gap-2">
                <Bone className="h-4 w-[40%]" />
                <Bone className="mx-auto h-9 w-[88px] rounded-lg" />
                <Bone className="h-4 w-[40%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4">
          <Bone className="mb-3 h-2.5 w-28" />
          <div className="flex gap-2.5 overflow-hidden">
            {[96, 80, 74].map(w => (
              <div
                key={w}
                className="flex w-[82px] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-light-border p-2 dark:border-dark-border"
              >
                <Bone className="h-2 w-10" />
                <Bone className="h-7 w-12 rounded" />
                <Bone className="h-2 w-14" />
              </div>
            ))}
          </div>
        </div>

        <div className="px-4">
          <Bone className="mb-3 h-2.5 w-24" />
          <div className="overflow-hidden rounded-xl border border-light-border dark:border-dark-border">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-[11px]',
                  i > 0 && 'border-t border-light-border dark:border-dark-border',
                )}
              >
                <Bone className="h-2.5 w-4 rounded-sm" />
                <Bone className="h-2.5 flex-1" style={{ maxWidth: `${55 + (i % 3) * 15}%` }} />
                <Bone className="h-2.5 w-5" />
                <Bone className="h-2.5 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
