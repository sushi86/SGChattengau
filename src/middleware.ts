import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

// WordPress-URL → Neue URL
const REDIRECTS: Record<string, string> = {
  // Sparten (alte WordPress-Slugs → neue Sparten-Seiten)
  '/fussball': '/sparten/fussball',
  '/schwimmen-2': '/sparten/schwimmen',
  '/volleyball-2': '/sparten/volleyball',
  '/tischtennis-2': '/sparten/tischtennis',
  '/tennis': '/sparten/tennis',
  '/judo-2': '/sparten/judo',
  '/laufen-2': '/sparten/laufen',
  '/triathlon-multisport': '/sparten/triathlon-multisport',
  '/kinderturnen-2': '/sparten/kinderturnen',
  '/rehasport': '/sparten/rehasport',
  '/gesundheitssport': '/sparten/gesundheitssport',
  '/fitness-gymnastik': '/sparten/fitness-gymnastik',
  '/nordic-walking': '/sparten/nordic-walking',
  '/fotografie': '/sparten/fotografie',

  // Kurse
  '/yoga': '/kurse/yoga',
  '/qigong': '/kurse/qigong',
  '/metalza': '/kurse/metalza',
  '/fit-am-montag': '/kurse/fit-am-montag',
  '/kurse': '/angebote',

  // Seiten
  '/ueber-uns': '/',
  '/angebot-uebersicht': '/angebote',
  '/veranstaltungen': '/termine',
  '/veranstaltungen/meine-buchungen': '/termine',
  '/veranstaltungen/veranstaltungsorte': '/termine',
  '/veranstaltungen/kategorien': '/termine',
  '/veranstaltungen/schlagwoerter': '/termine',
  '/stellenangebote': '/kontakt',

  // Spezielle Seiten
  '/1-chattengau-swim-2026': '/termine',
  '/3-niedensteiner-volkstriathlon-2': '/termine',
  '/3817-2': '/',
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 301-Redirect prüfen
  const redirect = REDIRECTS[path]
  if (redirect) {
    const url = request.nextUrl.clone()
    url.pathname = redirect
    return NextResponse.redirect(url, 301)
  }

  // Rate-Limiting für öffentliche API-Endpunkte
  if (path.startsWith('/api/v1/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const authHeader = request.headers.get('authorization')
    const limit = authHeader ? 300 : 100 // 300/min für auth, 100/min für public
    const windowMs = 60 * 1000 // 1 Minute

    const result = checkRateLimit(`api:${ip}`, limit, windowMs)

    if (!result.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Zu viele Anfragen. Bitte warte einen Moment.' } },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.jpeg|uploads).*)',
  ],
}
