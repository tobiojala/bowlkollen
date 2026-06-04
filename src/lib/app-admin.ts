type AdminUser = {
  id: string
  email?: string | null
  app_metadata?: Record<string, unknown>
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

function adminUserIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean),
  )
}

/** Server-side check for /admin access (proxy, route handlers). */
export function isAppAdmin(user: AdminUser): boolean {
  const meta = user.app_metadata ?? {}
  if (meta.role === 'admin' || meta.is_admin === true) return true
  if (user.email && adminEmails().has(user.email.toLowerCase())) return true
  if (adminUserIds().has(user.id)) return true
  return false
}
