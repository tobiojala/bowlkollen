type Props = { label: string }

export function ProfileSectionHeader({ label }: Props) {
  return (
    <div className="flex items-center gap-2 border-b border-light-border px-4 pt-4 pb-1.5 dark:border-dark-border">
      <div className="size-2 shrink-0 rounded-sm bg-dark-muted" />
      <span className="text-[10px] font-extrabold tracking-widest text-dark-muted uppercase">
        {label}
      </span>
    </div>
  )
}
