'use client'

import { SLLM_EVENT, SLLM_STATUS_LABEL } from '@/lib/sllm-data'

export function SLLMHero() {
  const isLive = SLLM_EVENT.status === 'live'
  const statusColor = isLive ? '#e05555' : '#f5c200'

  return (
    <div className="relative h-[210px] w-full overflow-hidden">
      <img
        src={SLLM_EVENT.banner}
        alt={SLLM_EVENT.name}
        className="block h-full w-full object-cover object-[center_30%]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)',
        }}
      />
      <div className="absolute right-0 bottom-0 left-0 px-4 py-3.5">
        <div
          className="mb-2 inline-flex items-center gap-1 rounded-[20px] px-2.5 py-0.5"
          style={{
            background: `rgba(${isLive ? '224,85,85' : '245,194,0'},0.2)`,
            border: `1px solid ${statusColor}55`,
          }}
        >
          {isLive && (
            <div
              className="size-[5px] rounded-full bg-red"
              style={{ boxShadow: '0 0 5px #e05555' }}
            />
          )}
          {!isLive && <span className="text-[9px]" style={{ color: statusColor }}>◆</span>}
          <span
            className="text-[9px] font-extrabold tracking-wide"
            style={{ color: statusColor }}
          >
            {SLLM_STATUS_LABEL[SLLM_EVENT.status]}
          </span>
        </div>
        <h1 className="mb-1 text-[19px] leading-tight font-black text-white">{SLLM_EVENT.name}</h1>
        <p className="text-[11px] text-white/72">
          {SLLM_EVENT.dates} · {SLLM_EVENT.venue}
        </p>
      </div>
    </div>
  )
}
