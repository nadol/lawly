/**
 * Type definitions for the Fragment Results View components.
 * These types define props for UI components and the return type for useFragmentResults hook.
 */

import type { SessionDetailResponse } from '../../types';

// =============================================================================
// State Machine Types
// =============================================================================

/**
 * State machine for the Fragment Results View.
 */
export type FragmentResultsState = 'loading' | 'success' | 'error' | 'timeout';

/**
 * ViewModel for the entire results view.
 * Aggregates all state needed for rendering.
 */
export interface FragmentResultsViewModel {
  state: FragmentResultsState;
  session: SessionDetailResponse | null;
  fragments: string[];
  error: string | null;
  isCopied: boolean;
  isSaving: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for FragmentResultsView component.
 */
export interface FragmentResultsViewProps {
  session: SessionDetailResponse;
}

/**
 * Props for ResultsContent component.
 */
export interface ResultsContentProps {
  session: SessionDetailResponse;
  fragments: string[];
  isCopied: boolean;
  onCopy: () => void;
}

/**
 * Props for ResultsError component.
 */
export interface ResultsErrorProps {
  message: string;
  onRetry: () => void;
  showFragments?: boolean;
  fragments?: string[];
}

/**
 * Props for FragmentsTextarea component.
 */
export interface FragmentsTextareaProps {
  fragments: string[];
  className?: string;
}

/**
 * Props for CopyAllButton component.
 */
export interface CopyAllButtonProps {
  fragments: string[];
  isCopied: boolean;
  onCopy: () => void;
  disabled?: boolean;
}

/**
 * Props for LoadingSpinner component.
 */
export interface LoadingSpinnerProps {
  className?: string;
}

/**
 * Props for StatusText component.
 */
export interface StatusTextProps {
  message?: string;
}

// =============================================================================
// Hook Types
// =============================================================================

/**
 * Return type for useFragmentResults hook.
 */
export interface UseFragmentResultsReturn {
  state: FragmentResultsState;
  session: SessionDetailResponse | null;
  fragments: string[];
  error: string | null;
  isCopied: boolean;
  copyToClipboard: () => Promise<void>;
  navigateToDashboard: () => void;
}
