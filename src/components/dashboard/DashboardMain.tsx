import { useCallback } from 'react';

import { useProfile } from '../hooks/useProfile';
import { WelcomeOverlay } from './WelcomeOverlay';

interface DashboardMainProps {
  /** Server-side fetched welcome state for initial render */
  initialHasSeenWelcome: boolean;
}

/**
 * Main content component for the dashboard.
 * Handles welcome overlay for first-time users.
 */
export function DashboardMain({ initialHasSeenWelcome }: DashboardMainProps) {
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

  const handleStartSession = async () => {
    handleWelcomeAction('start');
  };

  const handleSkip = async () => {
    handleWelcomeAction('skip');
  };

  const showWelcome = !hasSeenWelcome;

  return (
    <div className="relative h-full" aria-label="Główna zawartość">
      {showWelcome && (
        <WelcomeOverlay
          onStartSession={handleStartSession}
          onSkip={handleSkip}
          isLoading={isProfileLoading}
        />
      )}
      {/* Dashboard content when welcome is dismissed */}
      {!showWelcome && (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-4 p-8">
            <p className="text-lg">Wybierz sesję z historii lub rozpocznij nową</p>
          </div>
        </div>
      )}
    </div>
  );
}
