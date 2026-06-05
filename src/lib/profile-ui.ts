/** Profile page display helpers. */

export function profileRoleLabel(role: string): string {
  if (role === 'captain') return 'Kapten'
  if (role === 'admin') return 'Admin'
  return 'Styrelse'
}
