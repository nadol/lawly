import { WelcomeCard } from '../welcome';
import type { WelcomeOverlayProps } from './types';

/**
 * Welcome overlay component for first-time users.
 * Displays welcome card with backdrop blur over main content.
 */
export function WelcomeOverlay({ onStartSession, onSkip, isLoading }: WelcomeOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
      <WelcomeCard
        onStartSession={onStartSession}
        onSkip={onSkip}
        isLoading={isLoading}
      />
    </div>
  );
}
