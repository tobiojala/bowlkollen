'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AuthDebug() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data, error }) => {
      setInfo({
        session: data.session ? 'EXISTS - ' + data.session.user.email : 'NULL',
        error: error?.message || 'none',
        url: window.location.href,
        hash: window.location.hash,
        search: window.location.search,
      })
    })
  }, [])

  return (
    <pre style={{ padding: 24, fontFamily: 'monospace', fontSize: 13 }}>
      {JSON.stringify(info, null, 2)}
    </pre>
  )
}
