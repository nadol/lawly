import { useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

import type { LogoutError, UseLogoutReturn } from '../auth/types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

/**
 * Custom hook for managing the logout flow.
 * Handles loading state, error state, and Supabase signOut.
 */
export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LogoutError | null>(null);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        cookieOptions: {
          path: '/',
          sameSite: 'lax',
          secure: import.meta.env.PROD,
        },
      });
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Logout error:', signOutError);
        setError({
          message: 'Nie udało się wylogować. Spróbuj ponownie.',
          code: signOutError.code,
        });
        setIsLoading(false);
        return;
      }

      // Redirect to login page (full page reload to clear React state)
      window.location.assign('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError({
        message: 'Nie można połączyć z serwerem. Sprawdź połączenie internetowe.',
      });
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    handleLogout,
  };
}
