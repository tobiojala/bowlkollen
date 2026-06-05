import { TeamTillganglighetPageContent } from '@/components/team/TeamTillganglighetPageContent'

type Props = { params: Promise<{ id: string; matchid: string }> }

export default function TeamTillganglighetPage(props: Props) {
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <TeamTillganglighetPageContent {...props} />
    </main>
  )
}
