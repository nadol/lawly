import { Button } from '@/components/ui/button';
import { SessionCard } from './SessionCard';
import { SessionListSkeleton } from './SessionListSkeleton';
import { EmptyState } from './EmptyState';
import type { SessionListProps } from './types';

/**
 * Session list container component.
 * Renders session cards or appropriate state (loading, empty, error).
 */
export function SessionList({
  sessions,
  isLoading,
  error,
  onRetry,
}: SessionListProps) {
  if (isLoading) {
    return <SessionListSkeleton />;
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center p-8 text-center"
        role="alert"
        aria-live="polite"
      >
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button onClick={onRetry} variant="outline" size="sm">
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul role="list" className="space-y-1 p-2">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </ul>
  );
}
