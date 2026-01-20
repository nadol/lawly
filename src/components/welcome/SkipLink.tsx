import type { SkipLinkProps } from "./types";

/**
 * Secondary action link allowing users to skip the wizard.
 * Styled as a text link for secondary emphasis.
 */
export function SkipLink({ onSkip, isLoading }: SkipLinkProps) {
  return (
    <button
      type="button"
      onClick={onSkip}
      disabled={isLoading}
      className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      Przejdź do aplikacji
    </button>
  );
}
