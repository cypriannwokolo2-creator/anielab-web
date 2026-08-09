import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

/**
 * Admin guard — validates the signed admin session token (`admin_token`
 * cookie) against the backend, which checks it alongside the user's
 * Supabase session. Returns false instead of redirecting so the page can
 * render the admin login form (password + OTP).
 *
 * The admin password itself is never seen by the frontend server: it is
 * verified by the backend against a hashed record in Supabase.
 */
export async function isAdminSessionValid(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return false

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return false

  try {
    const res = await fetch(`${BACKEND}/api/admin/session`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'X-Admin-Token': token,
      },
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}
