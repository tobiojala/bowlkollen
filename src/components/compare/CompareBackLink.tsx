import type { ReactNode } from 'react'

type Props = { href: string; children: ReactNode }

export function CompareBackLink({ href, children }: Props) {
  return (
    <div className="absolute left-4 top-4 z-20">
      <a
        href={href}
        className="rounded-[20px] bg-black/28 px-3 py-[5px] text-xs text-white/60 no-underline backdrop-blur-md"
      >
        {children}
      </a>
    </div>
  )
}
