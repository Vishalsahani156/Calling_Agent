import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { AUTH_SESSION_COOKIE } from '@/lib/constants';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'] as const;

const DASHBOARD_ROUTES = [
  '/',
  '/campaigns',
  '/contacts',
  '/calls',
  '/analytics',
  '/knowledge',
  '/agents',
  '/users',
  '/settings',
] as const;

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTES.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`)),
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(AUTH_SESSION_COOKIE);

  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (isDashboardRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login/:path*',
    '/register/:path*',
    '/forgot-password/:path*',
    '/campaigns/:path*',
    '/contacts/:path*',
    '/calls/:path*',
    '/analytics/:path*',
    '/knowledge/:path*',
    '/agents/:path*',
    '/users/:path*',
    '/settings/:path*',
  ],
};
