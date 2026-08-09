/**
 * Client-side admin session token cookie helpers. The token is issued by the
 * backend after the password + OTP check and sent on X-Admin-Token for
 * privileged API calls. 12h TTL matches the backend's token lifetime.
 */
const COOKIE = 'admin_token'

export function getAdminToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function setAdminToken(token: string): void {
  document.cookie = `${COOKIE}=${encodeURIComponent(token)}; path=/; max-age=43200; SameSite=Lax`
}

export function clearAdminToken(): void {
  document.cookie = `${COOKIE}=; path=/; max-age=0`
}
