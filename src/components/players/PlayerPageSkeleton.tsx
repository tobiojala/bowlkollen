import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-black/7 dark:bg-white/7', className)} />
}

export function PlayerPageSkeleton() {
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <div className="mx-auto max-w-app">
        <Bone className="h-[100px] w-full rounded-none" />
        <div className="px-5 pt-0 pb-4" style={{ marginTop: -28 }}>
          <div className="flex items-end justify-between">
            <Bone className="h-[88px] w-[88px] rounded-full" />
            <Bone className="mb-2 h-9 w-24 rounded-full" />
          </div>
          <Bone className="mt-3 h-6 w-48" />
          <Bone className="mt-2 h-4 w-32" />
          <div className="mt-4 flex gap-2">
            <Bone className="h-10 flex-1 rounded-full" />
            <Bone className="h-10 flex-1 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-4 border-y border-light-border dark:border-dark-border">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="px-1 py-3.5 text-center">
              <Bone className="mx-auto h-6 w-10" />
              <Bone className="mx-auto mt-2 h-2 w-12" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export function PlayerPageLoadingSpinner() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
      <Loader2 className="h-6 w-6 animate-spin text-dark-muted" />
    </main>
  )
}
