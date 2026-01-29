import type { SessionHeaderProps } from './types';

/**
 * Header section for session details view.
 * Displays back navigation and session completion timestamp.
 */
export function SessionHeader({ formattedDate, completedAt }: SessionHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <a
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          className="size-4"
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Wróć do panelu głównego
      </a>

      {/* Session Timestamp */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          Szczegóły sesji
        </h1>
        <time dateTime={completedAt} className="text-sm text-muted-foreground">
          Ukończono: {formattedDate}
        </time>
      </div>
    </div>
  );
}
