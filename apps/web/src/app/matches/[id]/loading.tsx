import { Sk, SkScoreHero, SkMatchRow, SkPage } from '@/components/ui/Skeleton'

export default function MatchLoading() {
  return (
    <SkPage>
      {/* Score header */}
      <div className="border-b border-dark-border">
        <SkScoreHero />

        {/* Division + status chips */}
        <div className="flex gap-2 px-4 pb-4">
          <Sk className="h-6 w-24 rounded-full" />
          <Sk className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Individual game scores */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <Sk className="h-3.5 w-28" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Sk className="h-4 w-8 rounded" />
            <div className="flex gap-1.5 flex-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                <Sk key={j} className="h-7 w-7 rounded" />
              ))}
            </div>
            <Sk className="h-6 w-12 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Player results */}
      <div className="px-4 pt-2 flex flex-col gap-1 border-t border-dark-border">
        <Sk className="h-3.5 w-32 mt-4 mb-3" />
        {[1, 2, 3, 4, 5].map(i => (
          <SkMatchRow key={i} />
        ))}
      </div>
    </SkPage>
  )
}
