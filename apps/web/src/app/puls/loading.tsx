import { Sk, SkPage, SkScoreHero } from '@/components/ui/Skeleton'

export default function PulsLoading() {
  return (
    <SkPage>
      {/* Page title */}
      <div className="px-5 pt-5 pb-4 border-b border-dark-border flex items-center justify-between">
        <Sk className="h-5 w-32" />
        <Sk className="h-6 w-16 rounded-full" />
      </div>

      {/* Live gauge card */}
      <div className="mx-4 mt-4 rounded-2xl border border-dark-border overflow-hidden">
        <Sk className="h-0.5 w-full" />
        <SkScoreHero />

        {/* Gauge arc */}
        <div className="flex justify-center pb-4">
          <Sk className="h-14 w-28 rounded-xl" />
        </div>

        {/* Insight text */}
        <div className="px-4 pb-4 flex justify-center">
          <Sk className="h-3 w-48" />
        </div>
      </div>

      {/* Heat list */}
      <div className="mx-4 mt-4 rounded-2xl border border-dark-border overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-border">
          <Sk className="h-3 w-20" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-dark-border last:border-0">
            <Sk className="size-2 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <Sk className="h-3 w-40" />
              <Sk className="h-2.5 w-24" />
            </div>
            <Sk className="h-5 w-10 shrink-0" />
            <Sk className="h-1.5 w-8 rounded-full shrink-0" />
          </div>
        ))}
      </div>

      {/* Completed matches */}
      <div className="px-5 mt-6">
        <Sk className="h-3 w-28 mb-4" />
        <div className="rounded-2xl border border-dark-border overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-dark-border last:border-0">
              <SkScoreHero className="py-3" />
            </div>
          ))}
        </div>
      </div>
    </SkPage>
  )
}
