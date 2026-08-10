const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

/**
 * Ask the backend whether a Supabase access token belongs to an admin account.
 * The backend decides from the admin_credentials table — the source of truth —
 * because user_metadata.role can be missing (and clients can't be trusted).
 * Used to reject admin accounts on the normal site and to confirm eligibility
 * on /admin. Network failures resolve to false so regular users are never
 * blocked by a backend blip; a genuine admin hitting a down backend simply
 * retries.
 */
export async function isAdminAccessToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}/api/admin/check`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.admin === true
  } catch {
    return false
  }
}
