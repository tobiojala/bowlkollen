'use client'

import { useEffect, useState } from 'react'

// SSR-safe media query hook. Returns false on the server / first paint, then the
// real match after mount — so responsive-only behaviour (e.g. mobile serie tabs)
// never mismatches during hydration.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])
  return matches
}
