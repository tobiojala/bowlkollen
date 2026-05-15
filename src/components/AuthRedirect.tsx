'use client'

import { useEffect } from 'react'

export default function AuthRedirect() {
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      window.location.replace('/reset-password' + hash)
    }
  }, [])
  return null
}
