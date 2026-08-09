import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin guard — checks that:
 * 1. The user has a valid Supabase session.
 * 2. The `admin_password` cookie matches the ADMIN_PASSWORD env var.
 *
 * If either check fails, redirect to the landing page.
 * The admin password cookie is set by the client-side admin login flow
 * after a successful POST to /api/admin/auth on the backend.
 */
export async function requireAdmin(): Promise<void> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    // ADMIN_PASSWORD not configured — deny access.
    redirect('/')
  }

  // Check Supabase session.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Check admin password cookie.
  const cookieStore = await cookies()
  const adminPw = cookieStore.get('admin_password')?.value
  if (!adminPw || adminPw !== expected) {
    redirect('/')
  }
}
