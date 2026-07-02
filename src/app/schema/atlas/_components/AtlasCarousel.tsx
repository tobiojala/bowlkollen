'use client'

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'

export type AtlasCarouselHandle = { scrollToIndex: (i: number) => void }

type Props = {
  onIndexChange: (i: number) => void
  children:      React.ReactNode
}

/** Horizontal scroll-snap carousel — native scroll (touch swipe, trackpad,
 * click-drag) instead of a bespoke pointer-drag gesture, so there's no
 * touch-only gap to fix later (see project_schema_zoom_levels). */
export const AtlasCarousel = forwardRef<AtlasCarouselHandle, Props>(function AtlasCarousel(
  { onIndexChange, children }, ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isProgrammatic = useRef(false)

  useImperativeHandle(ref, () => ({
    scrollToIndex: (i: number) => {
      const el = scrollRef.current
      if (!el) return
      isProgrammatic.current = true
      el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
      setTimeout(() => { isProgrammatic.current = false }, 450)
    },
  }), [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (isProgrammatic.current || !el.clientWidth) return
      onIndexChange(Math.round(el.scrollLeft / el.clientWidth))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [onIndexChange])

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex', height: '100%', overflowX: 'auto', overflowY: 'hidden',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
})
