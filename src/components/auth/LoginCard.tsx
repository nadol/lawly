import { useEffect } from 'react';

import { useLogin } from '../hooks/useLogin';
import { GoogleLoginButton } from './GoogleLoginButton';
import { Tagline } from './Tagline';
import { TextLogo } from './TextLogo';
import type { LoginCardProps, AuthError } from './types';

/**
 * Maps error codes from URL to user-friendly messages
 */
function getErrorMessage(errorCode: string | undefined): AuthError | null {
  if (!errorCode) return null;

  const errorMessages: Record<string, string> = {
    access_denied: 'Logowanie zostało anulowane.',
    auth_failed: 'Nie udało się zalogować. Spróbuj ponownie.',
    missing_code: 'Błąd autoryzacji. Spróbuj ponownie.',
  };

  return {
    message: errorMessages[errorCode] ?? 'Wystąpił błąd podczas logowania.',
    code: errorCode,
  };
}

/**
 * Main React component containing the login UI.
 * Manages authentication state and orchestrates the login flow.
 */
export function LoginCard({ redirectUrl, errorCode }: LoginCardProps) {
  const { isLoading, error, handleGoogleLogin, clearError } = useLogin({
    redirectUrl,
  });

  // Set initial error from URL query parameter
  const urlError = getErrorMessage(errorCode);
  const displayError = error ?? urlError;

  // Clear URL error when user initiates new login
  useEffect(() => {
    if (isLoading && urlError) {
      // The URL error will be cleared when component re-renders after successful redirect
      // or when hook's error state changes
    }
  }, [isLoading, urlError]);

  const handleLogin = async () => {
    clearError();
    await handleGoogleLogin();
  };

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-lg">
      <div className="flex flex-col items-center gap-6">
        <TextLogo />
        <Tagline />

        <div className="w-full pt-2">
          <GoogleLoginButton
            onLogin={handleLogin}
            isLoading={isLoading}
          />
        </div>

        {displayError && (
          <div
            role="alert"
            className="w-full rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive"
          >
            {displayError.message}
          </div>
        )}
      </div>
    </div>
  );
}
