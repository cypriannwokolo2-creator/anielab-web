import { NextResponse, type NextRequest } from 'next/server'
import {
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

// @supabase/ssr persists the session in one cookie, sb-<project-ref>-auth-token,
// whose value is base64url(JSON) with an `expires_at` field (unix seconds).
const SESSION_COOKIE_RE = /^sb-[a-z0-9]+-auth-token$/

function hasValidSession(request: NextRequest): boolean {
  for (const { name, value } of request.cookies.getAll()) {
    if (!SESSION_COOKIE_RE.test(name)) continue
    try {
      const payload = JSON.parse(atob(value.replace(/-/g, '+').replace(/_/g, '/')))
      if (typeof payload?.expires_at === 'number' && payload.expires_at * 1000 > Date.now()) {
        return true
      }
    } catch {
      // Malformed cookie — treat as signed out.
    }
  }
  return false
}

export function middleware(request: NextRequest) {
  // In self-hosted `next start` the URL Next builds for the proxy uses the
  // server's own address (localhost), not the Host header, so host detection
  // must read the header directly — Caddy preserves it when reverse-proxying
  // to the container, and curl can fake it for local testing.
  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const { pathname } = request.nextUrl
  const signedIn = hasValidSession(request)

  // App host: every page requires a session. The root redirects to the
  // dashboard so signing in always lands somewhere useful.
  if (hostname === APP_HOST) {
    if (!signedIn) return NextResponse.redirect(new URL(LANDING_URL, request.url))
    if (pathname === '/') {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url))
    }
    return NextResponse.next()
  }

  // Landing host: signed-in visitors go straight to the app, and only the
  // landing page itself is served here — app routes live on the app host.
  if (hostname === LANDING_HOST || hostname === `www.${LANDING_HOST}`) {
    if (signedIn) {
      return NextResponse.redirect(new URL(`${APP_URL}${DASHBOARD_PATH}`, request.url))
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
