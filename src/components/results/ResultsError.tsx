import { Button } from '@/components/ui/button';
import type { ResultsErrorProps } from './types';

/**
 * Error state display with retry functionality.
 * Shows error message and action button.
 */
export function ResultsError({ message, onRetry }: ResultsErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <svg
        className="size-12 text-destructive"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="text-lg text-center text-muted-foreground max-w-md">{message}</p>
      <Button onClick={onRetry} variant="default">
        Spróbuj ponownie
      </Button>
    </div>
  );
}
