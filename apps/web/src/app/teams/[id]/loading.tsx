import { Sk, SkMatchRow, SkPage, SkRow } from '@/components/ui/Skeleton'

export default function TeamLoading() {
  return (
    <SkPage>
      {/* Team header */}
      <div className="px-5 pt-5 pb-4 border-b border-dark-border">
        <div className="flex items-center gap-4 mb-4">
          <Sk className="size-14 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Sk className="h-5 w-40" />
            <Sk className="h-3 w-24" />
          </div>
        </div>

        {/* Action chips */}
        <div className="flex gap-2">
          <Sk className="h-9 w-28 rounded-full" />
          <Sk className="h-9 w-24 rounded-full" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-px bg-dark-border mx-0">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-dark-bg flex flex-col items-center gap-1.5 py-4">
            <Sk className="h-6 w-10" />
            <Sk className="h-2.5 w-12" />
          </div>
        ))}
      </div>

      {/* Standing position */}
      <div className="mx-5 mt-5 rounded-2xl border border-dark-border p-4">
        <Sk className="h-3 w-24 mb-3" />
        <div className="flex items-center gap-3">
          <Sk className="h-10 w-10 rounded-xl" />
          <div className="flex-1 h-2.5 rounded-full overflow-hidden">
            <Sk className="h-full w-full" />
          </div>
          <Sk className="h-3 w-12" />
        </div>
      </div>

      {/* Match list */}
      <div className="mt-5 border-t border-dark-border">
        <div className="px-5 py-3 flex items-center justify-between">
          <Sk className="h-3 w-20" />
          <Sk className="h-6 w-16 rounded-full" />
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="border-t border-dark-border">
            <SkMatchRow />
          </div>
        ))}
      </div>

      {/* Roster */}
      <div className="mt-5 border-t border-dark-border px-5 pt-4">
        <Sk className="h-3 w-16 mb-4" />
        {[1, 2, 3, 4, 5].map(i => (
          <SkRow key={i} className="border-b border-dark-border last:border-0" />
        ))}
      </div>
    </SkPage>
  )
}
