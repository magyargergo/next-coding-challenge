import { NextRequest, NextResponse } from 'next/server'

const locales = ['en-US', 'en-GB']
const defaultLocale = 'en-GB'

function getLocale(request: NextRequest): string {
  // Check if there's a locale in the pathname
  const pathname = request.nextUrl.pathname
  const pathnameLocale = locales.find(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  if (pathnameLocale) return pathnameLocale

  // Detect based on Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || ''
  
  if (acceptLanguage.includes('en-US')) return 'en-US'
  if (acceptLanguage.includes('en-GB')) return 'en-GB'
  
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Handle legacy routes - redirect /us to /en-US
  if (pathname === '/us' || pathname.startsWith('/us/')) {
    const newPathname = pathname.replace('/us', '/en-US')
    return NextResponse.redirect(new URL(newPathname, request.url))
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // Redirect to locale-specific path
  const locale = getLocale(request)
  const newUrl = new URL(`/${locale}${pathname}`, request.url)
  return NextResponse.redirect(newUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
