import { createBrowserClient } from '@supabase/ssr'

// The session cookie must be shared across anielab.app, www.anielab.app and
// app.anielab.app. Without an explicit domain the browser makes the cookie
// host-only, so a login on the landing host is invisible to the app host and
// signed-in visitors get bounced back to the landing page.
function cookieOptions() {
  const shared =
    typeof window !== 'undefined' && window.location.hostname.endsWith('anielab.app')
  return shared
    ? { domain: '.anielab.app', path: '/', sameSite: 'lax' as const }
    : { path: '/', sameSite: 'lax' as const }
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: cookieOptions() }
  )
}
