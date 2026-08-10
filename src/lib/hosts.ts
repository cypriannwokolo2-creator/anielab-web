// Public hostnames for this deployment, shared by the host-gating middleware
// (src/middleware.ts) and every component that links across hosts:
//   anielab.app (and www.) — the marketing landing page
//   app.anielab.app        — the authenticated app (dashboard, create, etc.)
// The middleware redirects between the two based on the session cookie, so
// cross-host links must use these absolute URLs. Future tenant domains get
// their own apps and don't use these constants.
export const LANDING_HOST = 'anielab.app'
export const APP_HOST = 'app.anielab.app'
export const LANDING_URL = `https://${LANDING_HOST}`
export const APP_URL = `https://${APP_HOST}`
export const DASHBOARD_PATH = '/dashboard'
export const ADMIN_PATH = '/admin'
