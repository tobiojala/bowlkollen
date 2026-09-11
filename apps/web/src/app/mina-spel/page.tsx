import { MinaSpelClient } from './_components/MinaSpelClient'

// Mina spel — the player's own logged games + the spare analysis they feed.
// Client-side + auth-based (logging writes the user's own notes), so the shell
// just mounts the client.
export default function MinaSpelPage() {
  return <MinaSpelClient />
}
