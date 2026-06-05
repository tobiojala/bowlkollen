import { ExternalLink } from 'lucide-react'

type Props = {
  label: string
  value: string
  href?: string
}

export function HallInfoRow({ label, value, href }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-light-border py-3 last:border-b-0 dark:border-dark-border">
      <span className="text-[13px] text-dark-muted">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-gold"
        >
          {value}
          <ExternalLink size={12} />
        </a>
      ) : (
        <span className="max-w-[60%] text-right text-sm font-medium text-light-text dark:text-dark-text">
          {value}
        </span>
      )}
    </div>
  )
}
