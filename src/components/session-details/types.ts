/**
 * Type definitions for Session Details View.
 * Defines ViewModels and component props for displaying session history.
 */

// =============================================================================
// ViewModels
// =============================================================================

/**
 * ViewModel for a single question-answer pair.
 * Derived by joining session answers with questions data.
 */
export interface QAItemViewModel {
  /** Question order (1-5) */
  questionNumber: number;
  /** Unique identifier for accordion item */
  questionId: string;
  /** Full question text */
  questionText: string;
  /** Selected answer text */
  answerText: string;
}

/**
 * ViewModel for the complete session detail.
 * Transformed from SessionDetailResponse + QuestionsListResponse.
 */
export interface SessionDetailViewModel {
  /** Session UUID */
  id: string;
  /** Formatted completion date: "DD MMMM YYYY, HH:MM" */
  formattedDate: string;
  /** ISO timestamp for <time> element */
  completedAt: string;
  /** Question-answer pairs in order */
  qaItems: QAItemViewModel[];
  /** Generated SOW fragments */
  fragments: string[];
}

/**
 * State machine for session details view.
 */
export type SessionDetailsState = 'loading' | 'success' | 'error' | 'not-found';

// =============================================================================
// Component Props
// =============================================================================

export interface SessionDetailsViewProps {
  sessionId: string;
}

export interface SessionDetailsContentProps {
  session: SessionDetailViewModel;
  isCopied: boolean;
  onCopy: () => void;
}

export interface SessionDetailsErrorProps {
  message: string;
  onNavigateBack: () => void;
}

export interface SessionHeaderProps {
  formattedDate: string;
  completedAt: string;
}

export interface QAAccordionProps {
  items: QAItemViewModel[];
}

export interface QuestionAnswerItemProps {
  questionNumber: number;
  questionText: string;
  answerText: string;
  value: string;
}

export interface FragmentsSectionProps {
  fragments: string[];
  isCopied: boolean;
  onCopy: () => void;
}

// =============================================================================
// Hook Types
// =============================================================================

export interface UseSessionDetailsReturn {
  /** Current view state */
  state: SessionDetailsState;
  /** Transformed session data (null if loading/error) */
  session: SessionDetailViewModel | null;
  /** Error message if state is error */
  error: string | null;
  /** Whether fragments were copied */
  isCopied: boolean;
  /** Copy all fragments to clipboard */
  copyToClipboard: () => Promise<void>;
  /** Navigate back to dashboard */
  navigateToDashboard: () => void;
}
