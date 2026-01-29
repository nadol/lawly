import { useSessionDetails } from '@/components/hooks/useSessionDetails';
import { SessionDetailsSkeleton } from './SessionDetailsSkeleton';
import { SessionDetailsError } from './SessionDetailsError';
import { SessionDetailsContent } from './SessionDetailsContent';
import type { SessionDetailsViewProps } from './types';

/**
 * Root container component for session details view.
 * Orchestrates data fetching and conditionally renders loading, error, or content states.
 */
export function SessionDetailsView({ sessionId }: SessionDetailsViewProps) {
  const { state, session, error, isCopied, copyToClipboard, navigateToDashboard } =
    useSessionDetails(sessionId);

  // Loading state
  if (state === 'loading') {
    return <SessionDetailsSkeleton />;
  }

  // Error or not found state
  if (state === 'error' || state === 'not-found') {
    return (
      <SessionDetailsError
        message={error || 'Wystąpił nieznany błąd.'}
        onNavigateBack={navigateToDashboard}
      />
    );
  }

  // Success state - session should never be null here
  if (state === 'success' && session) {
    return (
      <SessionDetailsContent session={session} isCopied={isCopied} onCopy={copyToClipboard} />
    );
  }

  // Fallback (should never reach here)
  return null;
}
