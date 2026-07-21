import { Sk, SkText, SkMatchRow, SkPage } from '@/components/ui/Skeleton'

export default function PlayerLoading() {
  return (
    <SkPage>
      {/* DNA hero placeholder */}
      <div className="flex items-center justify-center pt-4 pb-2">
        <Sk className="h-3 w-16" />
      </div>
      <div className="mx-4 aspect-square max-h-72 rounded-2xl">
        <Sk className="h-72 w-full rounded-2xl" />
      </div>

      {/* Name + follow */}
      <div className="px-5 pt-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Sk className="h-6 w-44" />
          <Sk className="h-3 w-28" />
          <Sk className="h-3 w-36" />
        </div>
        <Sk className="h-9 w-20 rounded-full shrink-0 mt-1" />
      </div>

      {/* BK rating bar */}
      <div className="mx-5 mt-4 rounded-2xl border border-dark-border p-4 flex items-center gap-4">
        <div className="flex flex-col gap-1.5 shrink-0">
          <Sk className="h-2.5 w-16" />
          <Sk className="h-8 w-10" />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Sk className="h-1.5 w-full rounded-full" />
          <div className="flex justify-between">
            <Sk className="h-2 w-8" />
            <Sk className="h-2 w-8" />
          </div>
        </div>
        <Sk className="h-10 w-16 rounded-xl shrink-0" />
      </div>

      {/* Action buttons */}
      <div className="px-5 mt-4 flex gap-3">
        <Sk className="h-11 flex-1 rounded-full" />
        <Sk className="h-11 flex-1 rounded-full" />
      </div>

      {/* Stats grid */}
      <div className="mx-5 mt-5 border-t border-dark-border pt-4">
        <Sk className="h-2 w-full rounded-full mb-3" />
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Sk className="h-7 w-10" />
              <Sk className="h-2 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Match log */}
      <div className="mt-6 border-t border-dark-border">
        <div className="flex items-center gap-3 px-5 py-3">
          <Sk className="h-3 w-20" />
          {[1, 2, 3, 4].map(i => <Sk key={i} className="h-7 w-14 rounded-full" />)}
        </div>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="border-t border-dark-border">
            <SkMatchRow />
          </div>
        ))}
      </div>
    </SkPage>
  )
}
