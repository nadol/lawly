import { useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

import type { AuthError, UseLoginOptions, UseLoginReturn } from '../auth/types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

/**
 * Custom hook for managing the Google OAuth login flow.
 * Handles loading state, error state, and OAuth initiation via Supabase.
 */
export function useLogin({ redirectUrl }: UseLoginOptions): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const handleGoogleLogin = useCallback(async () => {
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

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) {
        console.error('OAuth initiation error:', authError);
        setError({
          message: 'Nie można rozpocząć logowania. Spróbuj ponownie.',
          code: authError.code,
        });
        setIsLoading(false);
      }
      // If no error, the user will be redirected to Google OAuth
    } catch (err) {
      console.error('Login error:', err);
      setError({
        message: 'Nie można połączyć z serwerem. Sprawdź połączenie internetowe.',
      });
      setIsLoading(false);
    }
  }, [redirectUrl]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    handleGoogleLogin,
    clearError,
  };
}
