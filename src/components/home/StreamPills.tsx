import { streamStyle } from '@/lib/match-ui'
import { cn } from '@/lib/cn'

type Props = {
  streams: { url: string }[]
  className?: string
}

export function StreamPills({ streams, className }: Props) {
  if (streams.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {streams.map((s, idx) => {
        const ss = streamStyle(s.url)
        return (
          <a
            key={idx}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.25 rounded-lg border px-2.5 py-1.25 text-[10px] font-bold no-underline"
            style={{
              color: ss.color,
              background: ss.bg,
              borderColor: ss.border,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              className="inline-block h-[5px] w-[5px] shrink-0 rounded-full"
              style={{ background: ss.color }}
            />
            {ss.label}
          </a>
        )
      })}
    </div>
  )
}
