import { useWelcome } from "../hooks/useWelcome";
import { CTAButton } from "./CTAButton";
import { SkipLink } from "./SkipLink";
import { WelcomeDescription } from "./WelcomeDescription";
import { WelcomeHeading } from "./WelcomeHeading";

export interface WelcomeCardProps {
  /** Optional callback for start session action. If not provided, uses internal hook. */
  onStartSession?: () => Promise<void>;
  /** Optional callback for skip action. If not provided, uses internal hook. */
  onSkip?: () => Promise<void>;
  /** Optional loading state override. If not provided, uses internal hook state. */
  isLoading?: boolean;
}

/**
 * Main React component containing the welcome UI.
 * Orchestrates the onboarding flow, manages API calls, and handles navigation.
 * Can be used standalone or controlled via props.
 */
export function WelcomeCard({ onStartSession, onSkip, isLoading: externalLoading }: WelcomeCardProps = {}) {
  const { isLoading: internalLoading, error, handleStartSession, handleSkip } = useWelcome();

  // Use provided callbacks or fall back to internal hook
  const startSession = onStartSession || handleStartSession;
  const skip = onSkip || handleSkip;
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  return (
    <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
      <div className="flex flex-col items-center gap-6">
        <WelcomeHeading />
        <WelcomeDescription />

        <div className="flex w-full flex-col items-center gap-4 pt-2">
          <CTAButton onStartSession={startSession} isLoading={isLoading} />
          <SkipLink onSkip={skip} isLoading={isLoading} />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="w-full rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive"
          >
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
