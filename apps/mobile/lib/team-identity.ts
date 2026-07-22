// Typographic team identity — no logos exist in BITS data, so identity is a
// name-hashed colour + initials (mirrors web lib/utils teamColor/teamInitials).
// Lightness nudged brighter than web (45%→~58%) to read on the near-black bg.
export function teamColor(name: string) {
  const hue = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return {
    bg: `hsl(${hue}, 38%, 14%)`,
    ring: `hsl(${hue}, 55%, 56%)`,
    text: `hsl(${hue}, 62%, 64%)`,
  };
}

export function teamInitials(name: string) {
  return (name || '')
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 3)
    .toUpperCase();
}
