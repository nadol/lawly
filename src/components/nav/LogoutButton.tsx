import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLogout } from '../hooks/useLogout';
import type { LogoutButtonProps } from '../auth/types';

/**
 * Loading spinner component (consistent with GoogleLoginButton)
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Logout button component for navigation.
 * Self-contained with internal state management via useLogout hook.
 */
export function LogoutButton({ className, disabled = false }: LogoutButtonProps) {
  const { isLoading, error, handleLogout } = useLogout();

  const handleClick = async () => {
    await handleLogout();
  };

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={isLoading || disabled}
        aria-label={isLoading ? 'Wylogowywanie w toku' : 'Wyloguj z aplikacji'}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2 size-4" />
            <span>Wylogowywanie...</span>
          </>
        ) : (
          <>
            <LogOut className="mr-2 size-4" />
            <span>Wyloguj</span>
          </>
        )}
      </Button>
      {error && (
        <div
          role="alert"
          className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive"
        >
          {error.message}
        </div>
      )}
    </div>
  );
}
