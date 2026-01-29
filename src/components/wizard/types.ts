/**
 * Type definitions for the Wizard View components.
 * These types define props for UI components and the return type for useWizard hook.
 */

import type { QuestionOption, QuestionResponse, SessionDetailResponse } from '../../types';

// =============================================================================
// ViewModel Types
// =============================================================================

/**
 * Aggregated wizard state for UI consumption.
 * Derived from useWizard hook state.
 */
export interface WizardViewModel {
  currentQuestion: QuestionResponse | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswerId: string | null;
  isLastQuestion: boolean;
  canProceed: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

export interface WizardContentProps {
  currentQuestion: QuestionResponse;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswerId: string | null;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  onSelectAnswer: (answerId: string) => void;
  onNext: () => void;
}

export interface WizardErrorProps {
  message: string;
  onRetry: () => void;
}

export interface ProgressStepperProps {
  currentStep: number;
  totalSteps: number;
}

export interface QuestionCardProps {
  questionText: string;
}

export interface AnswerOptionsProps {
  options: QuestionOption[];
  selectedAnswerId: string | null;
  questionId: string;
  onSelectAnswer: (answerId: string) => void;
}

export interface OptionCardProps {
  option: QuestionOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export interface NextButtonProps {
  isDisabled: boolean;
  isLastQuestion: boolean;
  isLoading: boolean;
  onNext: () => void;
}

// =============================================================================
// Hook Types
// =============================================================================

export interface WizardState {
  questions: QuestionResponse[];
  currentQuestionIndex: number;
  answers: Map<string, string>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export interface UseWizardReturn {
  questions: QuestionResponse[];
  currentQuestion: QuestionResponse | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswerId: string | null;
  isLastQuestion: boolean;
  canProceed: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  completedSession: SessionDetailResponse | null;
  selectAnswer: (answerId: string) => void;
  goToNext: () => Promise<void>;
  retry: () => void;
}
