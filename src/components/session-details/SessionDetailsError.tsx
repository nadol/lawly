import { Button } from '@/components/ui/button';
import type { SessionDetailsErrorProps } from './types';

/**
 * Error state component for session details view.
 * Displays user-friendly error message with option to return to dashboard.
 */
export function SessionDetailsError({ message, onNavigateBack }: SessionDetailsErrorProps) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center space-y-6">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 text-destructive" aria-hidden="true">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Wystąpił błąd</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {/* Back Button */}
        <Button onClick={onNavigateBack} variant="default">
          Wróć do panelu głównego
        </Button>
      </div>
    </div>
  );
}
