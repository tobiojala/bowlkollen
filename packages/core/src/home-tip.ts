// The home greeting + a personal note under it: a match-aware nudge when a fixture
// is close (prep / check your bag), otherwise a rotating fun-but-useful tip that
// changes daily. Pure so it's easy to test and shared verbatim by web + native.
// Tips lean into the app's own value (bag, oil, diary, scouting) — a reason to
// come back and prep.

export type HomeNote = { text: string; matchId: number | null };

export function greetingFor(hour: number, firstName: string | null): string {
  const base = hour < 10 ? 'God morgon' : hour < 18 ? 'God dag' : 'God kväll';
  return firstName ? `${base}, ${firstName}` : base;
}

const TIPS = [
  'Glöm inte kolla väskan innan matchen',
  'Kolla oljemönstret innan du väljer klot',
  'Rent klot ger bättre grepp — torka av innan spel',
  'Ny PB? Logga matchen i din dagbok',
  'Kolla dina bord mot nästa motståndare',
  'Drick vatten — jämn hand ger jämna serier',
  'Värm upp handleden innan första rutan',
];

export function homeNote(input: {
  daysToMatch: number | null;
  opponent: string | null;
  matchId: number | null;
  daySeed: number;
}): HomeNote {
  const { daysToMatch, opponent, matchId, daySeed } = input;
  const vs = opponent ? ` mot ${opponent}` : '';
  if (matchId != null && daysToMatch != null) {
    if (daysToMatch <= 0) return { text: `Matchdag${vs}! Har du kollat väskan?`, matchId };
    if (daysToMatch === 1) return { text: `Match imorgon${vs} — glöm inte kolla väskan`, matchId };
    if (daysToMatch <= 5) return { text: `Nästa match om ${daysToMatch} dagar${vs}. Dags att förbereda?`, matchId };
  }
  const i = ((daySeed % TIPS.length) + TIPS.length) % TIPS.length;
  return { text: TIPS[i], matchId: null };
}
