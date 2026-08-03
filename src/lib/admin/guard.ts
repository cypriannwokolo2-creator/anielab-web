import { redirect } from 'next/navigation'

/**
 * Admin guard — intentionally a no-op right now so the panel is reachable
 * without auth. Designed so wiring real admin auth later is a single change:
 * return `false` (or redirect) unless the current user passes an admin check.
 *
 * TODO(auth): when admin auth lands, read the session here (e.g. via
 * `@/lib/supabase/server` `getUser()`) and gate on an admin role instead of
 * always allowing.
 */
export async function requireAdmin(): Promise<void> {
  const allowed = process.env.ADMIN_OPEN === 'false' ? false : true
  if (!allowed) redirect('/')
}
