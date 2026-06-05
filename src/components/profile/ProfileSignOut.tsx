'use client'

import { LogOut } from 'lucide-react'

type Props = {
  onSignOut: () => void
}

export function ProfileSignOut({ onSignOut }: Props) {
  return (
    <button
      type="button"
      onClick={onSignOut}
      className="flex w-full cursor-pointer items-center gap-3 border-b border-light-border bg-transparent px-4 py-3.5 text-left transition-colors hover:bg-light-surface dark:border-dark-border dark:hover:bg-dark-surface"
    >
      <LogOut size={16} className="text-red" />
      <span className="text-sm font-semibold text-red">Logga ut</span>
    </button>
  )
}
