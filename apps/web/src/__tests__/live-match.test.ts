import { describe, it, expect, vi, afterEach } from 'vitest'
import { isMatchLive } from '@/lib/live-match'

// Freeze "now" to a fixed Swedish-local wall clock for deterministic windows.
const NOW = '2026-09-12T20:00:00'
const at = (s: string) => ({ is_finished: false, match_datetime: s })

describe('isMatchLive', () => {
  afterEach(() => vi.useRealTimers())
  const freeze = () => { vi.useFakeTimers(); vi.setSystemTime(new Date(NOW)) }

  it('is live during the match window', () => {
    freeze()
    expect(isMatchLive(at('2026-09-12T19:00:00'))).toBe(true)   // 1h in
    expect(isMatchLive(at('2026-09-12T19:50:00'))).toBe(true)   // just before start counts (lead)
  })

  it('is not live before the lead-in or after the window', () => {
    freeze()
    expect(isMatchLive(at('2026-09-12T21:00:00'))).toBe(false)  // starts in 1h
    expect(isMatchLive(at('2026-09-12T14:00:00'))).toBe(false)  // ended hours ago (>5h)
  })

  it('is never live when finished or dateless', () => {
    freeze()
    expect(isMatchLive({ is_finished: true, match_datetime: '2026-09-12T19:00:00' })).toBe(false)
    expect(isMatchLive({ is_finished: false, match_datetime: null })).toBe(false)
  })
})
