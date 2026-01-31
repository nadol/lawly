import type { SessionHeaderProps } from './types';

/**
 * Header section for session details view.
 * Displays back navigation and session completion timestamp.
 */
export function SessionHeader({ formattedDate, completedAt }: SessionHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
        Szczegóły sesji
      </h1>
      <time dateTime={completedAt} className="text-sm text-muted-foreground">
        Ukończono: {formattedDate}
      </time>
    </div>
  );
}
