import { useCallback } from 'react';

import { useSessions } from '../hooks/useSessions';
import { useProfile } from '../hooks/useProfile';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import type { DashboardContentProps } from './types';

/**
 * Main dashboard container component.
 * Orchestrates state management and renders sidebar and main content areas.
 */
export function DashboardContent({
  initialHasSeenWelcome,
}: DashboardContentProps) {
  const {
    sessions,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    retry,
  } = useSessions();

  const { hasSeenWelcome, isLoading: isProfileLoading, markWelcomeSeen } = useProfile(initialHasSeenWelcome);

  const handleWelcomeAction = useCallback(
    async (action: 'start' | 'skip') => {
      const success = await markWelcomeSeen();

      if (!success) {
        console.warn('Failed to update profile, but proceeding with action');
      }

      if (action === 'start') {
        window.location.assign('/wizard');
      }
      // For 'skip', we just hide the overlay by updating hasSeenWelcome
    },
    [markWelcomeSeen]
  );

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <Sidebar
        sessions={sessions}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        onLoadMore={loadMore}
        onRetry={retry}
      />
      <MainContent
        showWelcome={!hasSeenWelcome}
        isWelcomeLoading={isProfileLoading}
        onWelcomeAction={handleWelcomeAction}
      />
    </div>
  );
}
