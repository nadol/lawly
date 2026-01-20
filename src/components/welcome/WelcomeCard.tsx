import { useWelcome } from "../hooks/useWelcome";
import { CTAButton } from "./CTAButton";
import { SkipLink } from "./SkipLink";
import { WelcomeDescription } from "./WelcomeDescription";
import { WelcomeHeading } from "./WelcomeHeading";

/**
 * Main React component containing the welcome UI.
 * Orchestrates the onboarding flow, manages API calls, and handles navigation.
 */
export function WelcomeCard() {
  const { isLoading, error, handleStartSession, handleSkip } = useWelcome();

  return (
    <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
      <div className="flex flex-col items-center gap-6">
        <WelcomeHeading />
        <WelcomeDescription />

        <div className="flex w-full flex-col items-center gap-4 pt-2">
          <CTAButton onStartSession={handleStartSession} isLoading={isLoading} />
          <SkipLink onSkip={handleSkip} isLoading={isLoading} />
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
