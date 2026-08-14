import Link from 'next/link'

// Header for the standalone public pages (player / team / division). Wordmark home
// + a quiet login CTA. Centered to the same wide canvas as the page below it.
export default function PublicHeader() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1160,
        margin: '0 auto',
        padding: '18px 24px',
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-display, 'Barlow Condensed'), system-ui",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: '#f4f5f7',
          textDecoration: 'none',
        }}
      >
        Bowlkollen
      </Link>
      <Link
        href="/login"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'rgba(244,245,247,0.72)',
          textDecoration: 'none',
          padding: '8px 16px',
          borderRadius: 999,
          border: '1px solid rgba(244,245,247,0.14)',
        }}
      >
        Logga in
      </Link>
    </header>
  )
}
