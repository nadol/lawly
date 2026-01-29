import { useState, useCallback } from 'react';

import type { SessionDetailResponse } from '../../types';
import type {
  FragmentResultsState,
  UseFragmentResultsReturn,
} from '../results/types';

/**
 * Custom hook for managing the fragment results view.
 * Handles clipboard operations and navigation.
 *
 * @param session - The completed session with generated fragments
 * @returns Fragment results state and control functions
 */
export function useFragmentResults(
  session: SessionDetailResponse
): UseFragmentResultsReturn {
  const [state] = useState<FragmentResultsState>('success');
  const [error] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Extract fragments from session
  const fragments = session.generated_fragments;

  /**
   * Copies all fragments to clipboard.
   */
  const copyToClipboard = useCallback(async () => {
    try {
      const text = fragments.join('\n\n');
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard error:', err);
      // Could show error toast here if available
    }
  }, [fragments]);

  /**
   * Navigates back to the dashboard.
   */
  const navigateToDashboard = useCallback(() => {
    window.location.assign('/');
  }, []);

  return {
    state,
    session,
    fragments,
    error,
    isCopied,
    copyToClipboard,
    navigateToDashboard,
  };
}
