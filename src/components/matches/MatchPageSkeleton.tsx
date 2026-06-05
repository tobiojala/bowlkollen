import { cn } from '@/lib/cn'

function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-black/7 dark:bg-white/7', className)} />
}

export function MatchPageSkeleton() {
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <div className="mx-auto max-w-app pb-20">
        <div className="flex items-center gap-2 border-b border-light-border px-4 py-3 dark:border-dark-border">
          <Bone className="h-2 w-2 rounded-sm" />
          <Bone className="h-2.5 w-28" />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-light-border px-4 py-6 dark:border-dark-border">
          <div className="flex flex-col items-end gap-2">
            <Bone className="h-4 w-[70%]" />
            <Bone className="h-2 w-12" />
          </div>
          <Bone className="h-10 w-20 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Bone className="h-4 w-[70%]" />
            <Bone className="h-2 w-12" />
          </div>
        </div>
        <div className="flex flex-col gap-2.5 p-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="overflow-hidden rounded-[18px] border border-light-border dark:border-dark-border"
            >
              <Bone className="h-9 w-full rounded-none" />
              <div className="grid grid-cols-2 gap-px p-3">
                <Bone className="h-14 w-full" />
                <Bone className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
