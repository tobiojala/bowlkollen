import { TeamLaguttagningPageContent } from '@/components/team/TeamLaguttagningPageContent'

type Props = { params: Promise<{ id: string; matchid: string }> }

export default function TeamLaguttagningPage(props: Props) {
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <TeamLaguttagningPageContent {...props} />
    </main>
  )
}
