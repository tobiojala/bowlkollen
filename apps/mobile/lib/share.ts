// Shareable "moments" — the growth engine. Each moment is something emotional the
// delmatch data unlocks (a rivalry, your duel facit, a milestone) rendered as a
// screenshot-ready card, plus a one-line share text that carries the hook into a
// lagchatt. Keep the copy tight and Swedish; the card is the picture, this is the caption.

export type Moment =
  | { kind: 'rivalry'; aName: string; bName: string; aWins: number; bWins: number; meetings: number }
  | { kind: 'record'; name: string; wins: number; losses: number; winRate: number; played: number; highlight?: string }
  | { kind: 'milestone'; who: string; title: string; value: string; sub?: string };

const TAG = 'Bowlkollen';

export function momentShareText(m: Moment): string {
  switch (m.kind) {
    case 'rivalry': {
      const leader = m.aWins > m.bWins ? m.aName : m.bWins > m.aWins ? m.bName : null;
      const standing = leader ? `${leader} leder` : 'Helt jämnt';
      return `${m.aName} mot ${m.bName} vid bordet: ${m.aWins}–${m.bWins} genom åren, ${m.meetings} möten. ${standing}.\n\nSe era bord i ${TAG}.`;
    }
    case 'record': {
      const pct = Math.round(m.winRate * 100);
      const hi = m.highlight ? `\n${m.highlight}` : '';
      return `Mitt bordfacit: ${m.wins}–${m.losses} · ${pct}% vinst över ${m.played} bord.${hi}\n\n${TAG}.`;
    }
    case 'milestone':
      return `${m.title}: ${m.value}${m.sub ? ` (${m.sub})` : ''} — ${m.who}.\n\n${TAG}.`;
  }
}

// Short headline shown on the card itself (not the share caption).
export function momentHeadline(m: Moment): string {
  switch (m.kind) {
    case 'rivalry': return 'HETASTE BORDET';
    case 'record': return 'BORDFACIT';
    case 'milestone': return m.title.toUpperCase();
  }
}
