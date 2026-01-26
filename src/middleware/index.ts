import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { defineMiddleware } from 'astro:middleware';

import type { Database } from '../db/database.types';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/auth/callback'];

// Cookie options for Supabase auth
const cookieOptions: CookieOptions = {
  path: '/',
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: 'lax',
};

// Parse cookie header into array format required by getAll
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(';')
    .map((cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      return { name: name || '', value: rest.join('=') };
    })
    .filter((cookie) => cookie.name);
}

// Check if path is public (no auth required)
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Create Supabase client with proper cookie handling (getAll/setAll pattern)
  context.locals.supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always allow auth callback (it needs to process the OAuth code)
  if (pathname === '/auth/callback') {
    return next();
  }

  // Get authenticated user
  const {
    data: { user },
  } = await context.locals.supabase.auth.getUser();

  if (user) {
    // Authenticated user trying to access login page -> redirect to home
    if (pathname === '/login') {
      return context.redirect('/');
    }

    // Attach user to context for downstream use
    context.locals.user = user;
  } else {
    // Unauthenticated user on protected route -> redirect to login
    if (!isPublicPath(pathname)) {
      return context.redirect('/login');
    }
  }

  return next();
});
