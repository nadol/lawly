import type { APIRoute } from 'astro';

import type { ErrorResponse } from '../../../types';

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Signs out the currently authenticated user and clears server-side session cookies.
 * This endpoint is necessary because the auth cookies are httpOnly and cannot be
 * cleared by client-side JavaScript.
 *
 * @returns 200 - Success (empty response)
 * @returns 500 - ErrorResponse on server error
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  const supabase = locals.supabase;

  try {
    // Sign out the user (this clears the server-side session)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      const errorResponse: ErrorResponse = { error: 'Failed to sign out' };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Explicitly clear all Supabase auth cookies
    // These are the standard Supabase cookie names
    const authCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      // Supabase SSR also uses these patterns
      `sb-${import.meta.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
    ];

    authCookieNames.forEach((cookieName) => {
      cookies.delete(cookieName, {
        path: '/',
      });
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
