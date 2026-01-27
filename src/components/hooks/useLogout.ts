import { useState, useCallback } from 'react';

import type { LogoutError, UseLogoutReturn } from '../auth/types';

/**
 * Custom hook for managing the logout flow.
 * Handles loading state, error state, and calls server-side logout endpoint.
 */
export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LogoutError | null>(null);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call server-side logout endpoint to clear httpOnly cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Logout error:', errorData);
        setError({
          message: 'Nie udało się wylogować. Spróbuj ponownie.',
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
