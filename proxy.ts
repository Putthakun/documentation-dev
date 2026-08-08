import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export const proxy = createMiddleware(routing)

export const config = {
  // Skip _next internals, Vercel internals, and any request for a file with an extension
  // (favicon.ico, sitemap.xml, robots.txt, images, ...).
  matcher: '/((?!_next|_vercel|.*\\..*).*)',
}
