import { cn } from '@/lib/utils';
import type { SessionCardProps } from './types';

/**
 * Individual session card component.
 * Displays formatted session completion date and navigates to session detail on click.
 */
export function SessionCard({ session, isActive }: SessionCardProps) {
  return (
    <li>
      <a
        href={`/sessions/${session.id}`}
        className={cn(
          'block p-4 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-accent border-l-4 border-l-primary font-semibold'
            : 'hover:bg-accent/50'
        )}
        aria-label={`Zobacz sesję z dnia ${session.formattedDate}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <time
          dateTime={session.completedAt.toISOString()}
          className="text-sm"
        >
          {session.formattedDate}
        </time>
      </a>
    </li>
  );
}
