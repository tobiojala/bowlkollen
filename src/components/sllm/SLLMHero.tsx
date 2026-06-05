'use client'

import { SLLM_EVENT, SLLM_STATUS_LABEL } from '@/lib/sllm-data'
import {
  sllmBannerOverlayStyle,
  sllmLiveDotGlowStyle,
  sllmStatusColor,
  sllmStatusPillStyle,
  sllmStatusTextStyle,
} from '@/lib/sllm-ui'

export function SLLMHero() {
  const isLive = SLLM_EVENT.status === 'live'
  const statusColor = sllmStatusColor(isLive)

  return (
    <div className="relative h-[210px] w-full overflow-hidden">
      <img
        src={SLLM_EVENT.banner}
        alt={SLLM_EVENT.name}
        className="block h-full w-full object-cover object-[center_30%]"
      />
      <div className="absolute inset-0" style={sllmBannerOverlayStyle()} />
      <div className="absolute right-0 bottom-0 left-0 px-4 py-3.5">
        <div
          className="mb-2 inline-flex items-center gap-1 rounded-[20px] px-2.5 py-0.5"
          style={sllmStatusPillStyle(isLive, statusColor)}
        >
          {isLive && (
            <div className="size-[5px] rounded-full bg-red" style={sllmLiveDotGlowStyle()} />
          )}
          {!isLive && <span className="text-[9px]" style={sllmStatusTextStyle(statusColor)}>◆</span>}
          <span className="text-[9px] font-extrabold tracking-wide" style={sllmStatusTextStyle(statusColor)}>
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
