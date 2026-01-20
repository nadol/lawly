/**
 * Type definitions for the authentication components.
 */

/**
 * Props for the LoginLayout component
 */
export interface LoginLayoutProps {
  title?: string;
}

/**
 * Props for the LoginCard component
 */
export interface LoginCardProps {
  /** Full URL for OAuth callback redirect */
  redirectUrl: string;
  /** Error code from URL query parameter (if redirected after failed auth) */
  errorCode?: string;
}

/**
 * Props for the GoogleLoginButton component
 */
export interface GoogleLoginButtonProps {
  /** Callback function to initiate login flow */
  onLogin: () => Promise<void>;
  /** Whether the login process is in progress */
  isLoading: boolean;
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * Authentication error state for display
 */
export interface AuthError {
  /** Error message to display to user */
  message: string;
  /** Original error code from Supabase (for logging) */
  code?: string;
}

/**
 * Login state managed by useLogin hook
 */
export interface LoginState {
  /** Whether OAuth flow is in progress */
  isLoading: boolean;
  /** Current error, if any */
  error: AuthError | null;
}

/**
 * Options for useLogin hook
 */
export interface UseLoginOptions {
  redirectUrl: string;
}

/**
 * Return type for useLogin hook
 */
export interface UseLoginReturn {
  /** Current loading state */
  isLoading: boolean;
  /** Current error state */
  error: AuthError | null;
  /** Function to initiate Google OAuth login */
  handleGoogleLogin: () => Promise<void>;
  /** Function to clear error state */
  clearError: () => void;
}
