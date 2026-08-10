import { NextResponse, type NextRequest } from 'next/server'
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

// @supabase/ssr persists the session in cookies named sb-<project-ref>-auth-token.
// Large sessions are CHUNKED into .0/.1/… parts that must be rejoined in
// order before parsing — matching only the exact base name silently treats
// signed-in visitors as signed out.
const SESSION_COOKIE_RE = /^sb-[a-z0-9]+-auth-token(?:\.(\d+))?$/

type SessionInfo = { signedIn: boolean; isAdmin: boolean }

function getSession(request: NextRequest): SessionInfo {
  const chunks: { index: number; value: string }[] = []
  let single: string | null = null
  for (const { name, value } of request.cookies.getAll()) {
    const m = SESSION_COOKIE_RE.exec(name)
    if (!m) continue
    if (m[1] === undefined) single = value
    else chunks.push({ index: Number(m[1]), value })
  }
  const raw = chunks.length > 0
    ? chunks.sort((a, b) => a.index - b.index).map((c) => c.value).join('')
    : single
  if (!raw) return { signedIn: false, isAdmin: false }
  try {
    const payload = JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')))
    const signedIn = typeof payload?.expires_at === 'number' && payload.expires_at * 1000 > Date.now()
    const isAdmin = payload?.user?.user_metadata?.role === 'admin'
    return { signedIn, isAdmin }
  } catch {
    // Malformed cookie — treat as signed out.
    return { signedIn: false, isAdmin: false }
  }
}

export function middleware(request: NextRequest) {
  // In self-hosted `next start` the URL Next builds for the proxy uses the
  // server's own address (localhost), not the Host header, so host detection
  // must read the header directly — Caddy preserves it when reverse-proxying
  // to the container, and curl can fake it for local testing.
  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const { pathname } = request.nextUrl
  const { signedIn, isAdmin } = getSession(request)

  // App host: every page requires a session. Admins are locked to the admin
  // panel; regular users are kept out of it. The root lands on the dashboard.
  if (hostname === APP_HOST) {
    if (!signedIn) return NextResponse.redirect(new URL(LANDING_URL, request.url))
    if (isAdmin) {
      if (pathname !== ADMIN_PATH) {
        return NextResponse.redirect(new URL(`${APP_URL}${ADMIN_PATH}`, request.url))
      }
      return NextResponse.next()
    }
    if (pathname === ADMIN_PATH) {
      return NextResponse.redirect(new URL(`${APP_URL}${DASHBOARD_PATH}`, request.url))
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url))
    }
    return NextResponse.next()
  }

  // Landing host: signed-in visitors go straight into the app (admins to the
  // panel), and only the landing page itself is served here — app routes
  // live on the app host.
  if (hostname === LANDING_HOST || hostname === `www.${LANDING_HOST}`) {
    if (signedIn) {
      const target = isAdmin ? `${APP_URL}${ADMIN_PATH}` : `${APP_URL}${DASHBOARD_PATH}`
      return NextResponse.redirect(new URL(target, request.url))
    }
    if (pathname !== '/') {
      return NextResponse.redirect(new URL(LANDING_URL, request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
