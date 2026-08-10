import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Mirror of the browser client's shared-domain cookie policy: refreshed
// sessions written server-side must also be visible across apex/www/app.
// Local dev (no anielab.app host) keeps plain host-only cookies.
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.anielab.app' : undefined

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, domain: COOKIE_DOMAIN })
          )
        },
      },
    }
  )
}

/** Server-side session check. Returns the Supabase user or null. */
export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
