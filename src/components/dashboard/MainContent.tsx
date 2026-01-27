import { WelcomeOverlay } from './WelcomeOverlay';
import type { MainContentProps } from './types';

/**
 * Main content area component.
 * Shows welcome overlay for first-time users or placeholder content.
 */
export function MainContent({ showWelcome, isWelcomeLoading, onWelcomeAction }: MainContentProps) {
  const handleStartSession = async () => {
    onWelcomeAction('start');
  };

  const handleSkip = async () => {
    onWelcomeAction('skip');
  };

  return (
    <main className="flex-1 relative" aria-label="Główna zawartość">
      {showWelcome && (
        <WelcomeOverlay
          onStartSession={handleStartSession}
          onSkip={handleSkip}
          isLoading={isWelcomeLoading}
        />
      )}
      {/* Main content placeholder - will be used for future features */}
      <div className="h-full" aria-hidden={showWelcome} />
    </main>
  );
}
