import { TeamInternPageContent } from '@/components/team/TeamInternPageContent'

type Props = { params: Promise<{ id: string }> }

export default function TeamInternPage(props: Props) {
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <TeamInternPageContent {...props} />
    </main>
  )
}
