/**
 * Type definitions for the dashboard view components and hooks.
 */

// =============================================================================
// ViewModel Types
// =============================================================================

/**
 * ViewModel for session display with pre-formatted date.
 * Transforms SessionSummary for UI consumption.
 */
export interface SessionCardViewModel {
  /** Session UUID */
  id: string;
  /** Formatted date string: "DD MMMM YYYY, HH:MM" in Polish locale */
  formattedDate: string;
  /** Original completion timestamp for sorting reference */
  completedAt: Date;
}

/**
 * State for the sessions list with pagination metadata.
 */
export interface SessionsState {
  /** List of session view models */
  sessions: SessionCardViewModel[];
  /** Total number of user's sessions */
  total: number;
  /** Current offset for pagination */
  offset: number;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether pagination load is in progress */
  isLoadingMore: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether more sessions are available */
  hasMore: boolean;
}

/**
 * State for the dashboard profile data.
 */
export interface ProfileState {
  /** Whether user has seen welcome screen */
  hasSeenWelcome: boolean;
  /** Whether profile is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for DashboardContent component.
 */
export interface DashboardContentProps {
  /** Server-side fetched welcome state for initial render */
  initialHasSeenWelcome: boolean;
}

/**
 * Props for Sidebar component.
 */
export interface SidebarProps {
  sessions: SessionCardViewModel[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetry: () => void;
  /** Currently active session ID (if on a session detail page) */
  activeSessionId?: string | null;
}

/**
 * Props for SessionList component.
 */
export interface SessionListProps {
  sessions: SessionCardViewModel[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Currently active session ID (if on a session detail page) */
  activeSessionId?: string | null;
}

/**
 * Props for SessionCard component.
 */
export interface SessionCardProps {
  session: SessionCardViewModel;
  /** Whether this session is currently active/selected */
  isActive?: boolean;
}

/**
 * Props for SessionListSkeleton component.
 */
export interface SessionListSkeletonProps {
  /** Number of skeleton items to display */
  count?: number;
}

/**
 * Props for EmptyState component.
 */
export interface EmptyStateProps {
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Props for LoadMoreButton component.
 */
export interface LoadMoreButtonProps {
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

/**
 * Props for NewSessionButton component.
 */
export interface NewSessionButtonProps {
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Props for MainContent component.
 */
export interface MainContentProps {
  showWelcome: boolean;
  isWelcomeLoading: boolean;
  onWelcomeAction: (action: 'start' | 'skip') => void;
}

/**
 * Props for WelcomeOverlay component.
 */
export interface WelcomeOverlayProps {
  /** Callback for "Start session" action */
  onStartSession: () => void;
  /** Callback for "Skip" action */
  onSkip: () => void;
  /** Loading state for welcome actions */
  isLoading: boolean;
}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Return type for useSessions hook.
 */
export interface UseSessionsReturn {
  /** List of session view models */
  sessions: SessionCardViewModel[];
  /** Total number of sessions */
  total: number;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether pagination load is in progress */
  isLoadingMore: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether more sessions available */
  hasMore: boolean;
  /** Load more sessions (pagination) */
  loadMore: () => Promise<void>;
  /** Retry failed fetch */
  retry: () => Promise<void>;
  /** Refresh all sessions */
  refresh: () => Promise<void>;
}

/**
 * Return type for useProfile hook.
 */
export interface UseProfileReturn {
  /** Whether user has seen welcome */
  hasSeenWelcome: boolean;
  /** Whether profile is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Mark welcome as seen */
  markWelcomeSeen: () => Promise<boolean>;
}
