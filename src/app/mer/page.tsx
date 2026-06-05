import Link from 'next/link'
import { MapPin, ShoppingBag, Droplets } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { homeNoTapHighlight, homeStaggerDelayStyle } from '@/lib/home-ui'

const ITEMS: {
  href: string
  icon: LucideIcon
  label: string
  sub: string
  description: string
}[] = [
  {
    href: '/hallar',
    icon: MapPin,
    label: 'Bowlinghallar',
    sub: '174 hallar i Sverige',
    description: 'Hitta närmaste bowlinghall, öppettider, banor och bokningslänkar.',
  },
  {
    href: '/klotshopar',
    icon: ShoppingBag,
    label: 'Klotshopar',
    sub: '16 pro shops',
    description: 'Hitta pro shops med IBPSIA-certifierade tekniker.',
  },
  {
    href: '/oljeprofiler',
    icon: Droplets,
    label: 'Oljeprofiler',
    sub: 'Säsong 2025/2026',
    description: 'Svenska Bowlingförbundets godkända oljeprofiler för alla divisioner.',
  },
]

export default function MerPage() {
  return (
    <div className="min-h-screen bg-light-bg pb-24 text-[#1a2535] dark:bg-dark-bg dark:text-white">
      <div className="px-5 pt-5 pb-4">
        <p className="m-0 text-[13px] text-dark-muted">Utforska</p>
      </div>

      <div className="flex flex-col gap-3 px-4 py-2">
        {ITEMS.map(({ href, icon: Icon, label, sub, description }, i) => (
          <Link
            key={href}
            href={href}
            style={homeStaggerDelayStyle(i)}
            className={cn(
              'bk-stagger-item flex items-center gap-4 rounded-[18px] border p-4 no-underline',
              'border-light-border bg-light-card',
              'dark:border-dark-border dark:bg-dark-card',
              'transition-transform duration-150 active:scale-[0.98]',
              homeNoTapHighlight,
            )}
          >
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]',
                'border border-gold/25 bg-gold/10',
              )}
            >
              <Icon size={22} className="text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base leading-tight font-extrabold bk-text-primary">{label}</div>
              <div className="mt-0.5 text-xs text-dark-muted">{sub}</div>
              <div className="mt-1 text-xs leading-snug text-dark-muted">{description}</div>
            </div>
            <span className="shrink-0 text-[22px] text-dark-muted" aria-hidden>
              ›
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
