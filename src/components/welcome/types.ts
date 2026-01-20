/**
 * Type definitions for the welcome screen components.
 */

/**
 * Props for the CTAButton component
 */
export interface CTAButtonProps {
  /** Callback to initiate first wizard session */
  onStartSession: () => Promise<void>;
  /** Whether the action is in progress */
  isLoading: boolean;
}

/**
 * Props for the SkipLink component
 */
export interface SkipLinkProps {
  /** Callback to skip welcome and go to main app */
  onSkip: () => Promise<void>;
  /** Whether the action is in progress */
  isLoading: boolean;
}

/**
 * Error state for welcome view
 */
export interface WelcomeError {
  /** User-friendly error message */
  message: string;
}

/**
 * State managed by useWelcome hook
 */
export interface WelcomeState {
  /** Whether API call is in progress */
  isLoading: boolean;
  /** Current error, if any */
  error: WelcomeError | null;
}

/**
 * Return type for useWelcome hook
 */
export interface UseWelcomeReturn {
  /** Current loading state */
  isLoading: boolean;
  /** Current error state */
  error: WelcomeError | null;
  /** Handle "Start First Session" click - updates profile, navigates to wizard */
  handleStartSession: () => Promise<void>;
  /** Handle "Skip" click - updates profile, navigates to main app */
  handleSkip: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}
