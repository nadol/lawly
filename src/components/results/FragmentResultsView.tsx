import { useFragmentResults } from '../hooks/useFragmentResults';
import { LoadingState } from './LoadingState';
import { ResultsError } from './ResultsError';
import { ResultsContent } from './ResultsContent';
import type { FragmentResultsViewProps } from './types';

/**
 * Root container component for the fragment results view.
 * Orchestrates transitions between loading, error, and success states based on API response.
 */
export function FragmentResultsView({ session }: FragmentResultsViewProps) {
  const { state, fragments, error, isCopied, copyToClipboard, navigateToDashboard } =
    useFragmentResults(session);

  if (state === 'loading') {
    return <LoadingState />;
  }

  if (state === 'error' || state === 'timeout') {
    return (
      <ResultsError
        message={error ?? 'Wystąpił nieznany błąd. Spróbuj ponownie.'}
        onRetry={navigateToDashboard}
      />
    );
  }

  if (state === 'success' && fragments.length > 0) {
    return (
      <ResultsContent
        session={session}
        fragments={fragments}
        isCopied={isCopied}
        onCopy={copyToClipboard}
      />
    );
  }

  // Fallback for unexpected states
  return (
    <ResultsError
      message="Nie udało się wczytać fragmentów."
      onRetry={navigateToDashboard}
    />
  );
}
