import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  ADMIN_PATH,
  APP_HOST,
  APP_URL,
  DASHBOARD_PATH,
  LANDING_HOST,
  LANDING_URL,
} from '@/lib/hosts'

// Two public hosts share this Next.js app, and the session cookie decides who
// sees what:
//   anielab.app (and www.)  → marketing landing page; signed-in visitors are
//                             sent into the app instead.
//   app.anielab.app          → the authenticated app; anyone without a session
//                             is sent back to the landing page, and the root
//                             lands on the dashboard.
// Any other host (localhost dev, future tenant domains) passes through
// untouched — the gating below only applies to the AnieLab hostnames.

// Mirror of the browser/server client's shared-domain cookie policy so the
// session stays visible across apex/www/app. Local dev keeps host-only cookies.
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.anielab.app' : undefined

type SessionInfo = { signedIn: boolean; isAdmin: boolean }

// @supabase/ssr persists the session in cookies named sb-<project-ref>-auth-token,
// chunked into .0/.1/… parts for large sessions. This regular expression is only
// a coarse "is there a session at all" check used during a Supabase outage.
const SESSION_COOKIE_RE = /^sb-[a-z0-9]+-auth-token/

// Optimistic fallback when Supabase is unreachable (getUser() threw). Parses the
// stored session by hand so a signed-in user is not bounced to the landing page
// during a backend blip — same heuristic as the old middleware.
function optimisticSession(request: NextRequest): SessionInfo {
  const hasAdminToken = Boolean(request.cookies.get('admin_token')?.value)
  const chunks: { index: number; value: string }[] = []
  let single: string | null = null
  for (const { name, value } of request.cookies.getAll()) {
    const m = /^sb-[a-z0-9]+-auth-token(?:\.(\d+))?$/.exec(name)
    if (!m) continue
    if (m[1] === undefined) single = value
    else chunks.push({ index: Number(m[1]), value })
  }
  const raw = chunks.length > 0
    ? chunks.sort((a, b) => a.index - b.index).map((c) => c.value).join('')
    : single
  if (!raw) return { signedIn: false, isAdmin: false }
  try {
    const b64 = raw.startsWith('base64-') ? raw.slice('base64-'.length) : raw
    const payload = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')))
    const signedIn = typeof payload?.expires_at === 'number' && payload.expires_at * 1000 > Date.now()
    const isAdmin = hasAdminToken || payload?.user?.user_metadata?.role === 'admin'
    return { signedIn, isAdmin }
  } catch {
    return { signedIn: false, isAdmin: false }
  }
}

export async function proxy(request: NextRequest) {
  // In self-hosted `next start` the URL Next builds for the proxy uses the
  // server's own address (localhost), not the Host header, so host detection
  // must read the header directly — Caddy preserves it when reverse-proxying
  // to the container, and curl can fake it for local testing.
  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const { pathname } = request.nextUrl

  // An unlocked admin panel always carries its session token — trust it as an
  // admin signal even when the Supabase session lacks role='admin'.
  const hasAdminToken = Boolean(request.cookies.get('admin_token')?.value)

  const cookieWrites: { name: string; value: string; options?: Record<string, unknown> }[] = []

  // Authoritative session check. getUser() validates against Supabase, refreshes
  // expired tokens, and hands the refreshed cookies back through setAll — so the
  // proxy and the pages always agree on who is signed in, which is what breaks
  // the app↔landing redirect loop that a stale cookie used to cause.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookieWrites.push(...cookiesToSet)
        },
      },
    }
  )

  let session: SessionInfo | null = null
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    session = {
      signedIn: Boolean(user),
      isAdmin: hasAdminToken || user?.user_metadata?.role === 'admin',
    }
  } catch {
    // Supabase is down — fall back to optimistic cookie parsing rather than
    // bouncing every signed-in user to the landing page mid-outage.
    session = optimisticSession(request)
  }

  let response: NextResponse

  // App host: every page except /admin requires a session — /admin is the
  // self-contained admin entry point (it carries its own Supabase sign-in).
  // Admins are locked to the panel; regular users are kept out of it.
  if (hostname === APP_HOST) {
    if (!session.signedIn) {
      response = pathname === ADMIN_PATH
        ? NextResponse.next()
        : NextResponse.redirect(new URL(LANDING_URL, request.url))
    } else if (session.isAdmin) {
      response = pathname !== ADMIN_PATH
        ? NextResponse.redirect(new URL(`${APP_URL}${ADMIN_PATH}`, request.url))
        : NextResponse.next()
    } else if (pathname === ADMIN_PATH) {
      // /admin stays reachable for every signed-in account: admin accounts whose
      // session metadata lacks role='admin' must still reach their panel, and
      // non-admins get rejected by the backend during the unlock flow itself.
      response = NextResponse.next()
    } else if (pathname === '/') {
      response = NextResponse.redirect(new URL(DASHBOARD_PATH, request.url))
    } else {
      response = NextResponse.next()
    }
  } else if (hostname === LANDING_HOST || hostname === `www.${LANDING_HOST}`) {
    // Landing host: signed-in visitors go straight into the app (admins to the
    // panel), and only the landing page itself is served here — app routes
    // live on the app host.
    if (session.signedIn) {
      const target = session.isAdmin ? `${APP_URL}${ADMIN_PATH}` : `${APP_URL}${DASHBOARD_PATH}`
      response = NextResponse.redirect(new URL(target, request.url))
    } else if (pathname !== '/') {
      response = NextResponse.redirect(new URL(LANDING_URL, request.url))
    } else {
      response = NextResponse.next()
    }
  } else {
    response = NextResponse.next()
  }

  // Re-apply any cookie writes (token refresh, session clear on sign-out) to the
  // response we actually return, so the browser picks them up even across a
  // redirect — keeping the proxy and page session state in lockstep.
  for (const { name, value, options } of cookieWrites) {
    response.cookies.set(name, value, { ...options, domain: COOKIE_DOMAIN })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}