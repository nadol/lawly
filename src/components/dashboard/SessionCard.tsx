import type { SessionCardProps } from './types';

/**
 * Individual session card component.
 * Displays formatted session completion date and navigates to session detail on click.
 */
export function SessionCard({ session }: SessionCardProps) {
  return (
    <li>
      <a
        href={`/sessions/${session.id}`}
        className="block p-4 hover:bg-accent rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Zobacz sesję z dnia ${session.formattedDate}`}
      >
        <time
          dateTime={session.completedAt.toISOString()}
          className="text-sm font-medium"
        >
          {session.formattedDate}
        </time>
      </a>
    </li>
  );
}
