import { useState, useEffect, useCallback, useMemo } from 'react';

import type {
  AnswerItem,
  QuestionsListResponse,
  QuestionResponse,
  SessionDetailResponse,
  ErrorResponse,
} from '../../types';
import type { UseWizardReturn } from '../wizard/types';

/**
 * Custom hook for managing the wizard flow.
 * Handles question fetching, answer selection, and session submission.
 *
 * @returns Wizard state and control functions
 */
export function useWizard(): UseWizardReturn {
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSession, setCompletedSession] = useState<SessionDetailResponse | null>(null);

  // Derived state
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const totalQuestions = questions.length;
  const selectedAnswerId = useMemo(
    () => (currentQuestion ? answers.get(currentQuestion.id) ?? null : null),
    [currentQuestion, answers]
  );
  const isLastQuestion = totalQuestions > 0 && currentQuestionIndex === totalQuestions - 1;
  const canProceed = selectedAnswerId !== null;

  /**
   * Fetches questions from the API.
   */
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/questions');

      if (response.status === 401) {
        window.location.assign('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data: QuestionsListResponse = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      console.error('Questions fetch error:', err);
      setError('Nie można załadować pytań. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Selects an answer for the current question.
   * Replaces any previously selected answer for this question.
   */
  const selectAnswer = useCallback(
    (answerId: string) => {
      if (!currentQuestion) {
        return;
      }

      setAnswers((prev) => {
        const newAnswers = new Map(prev);
        newAnswers.set(currentQuestion.id, answerId);
        return newAnswers;
      });
    },
    [currentQuestion]
  );

  /**
   * Submits the session to the API with all collected answers.
   */
  const submitSession = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const answersArray: AnswerItem[] = Array.from(answers.entries()).map(
        ([question_id, answer_id]) => ({ question_id, answer_id })
      );

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray }),
      });

      if (response.status === 401) {
        window.location.assign('/login');
        return;
      }

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error);
      }

      const session: SessionDetailResponse = await response.json();
      setCompletedSession(session);
    } catch (err) {
      console.error('Session submission error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się zapisać sesji. Spróbuj ponownie.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [answers]);

  /**
   * Proceeds to the next question or submits the session if on the last question.
   */
  const goToNext = useCallback(async () => {
    if (!canProceed) {
      return;
    }

    if (isLastQuestion) {
      await submitSession();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [canProceed, isLastQuestion, submitSession]);

  /**
   * Retries the last failed operation (fetch or submit).
   */
  const retry = useCallback(() => {
    if (questions.length === 0) {
      fetchQuestions();
    } else {
      submitSession();
    }
  }, [questions.length, fetchQuestions, submitSession]);

  // Initial fetch on mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswerId,
    isLastQuestion,
    canProceed,
    isLoading,
    isSubmitting,
    error,
    completedSession,
    selectAnswer,
    goToNext,
    retry,
  };
}
