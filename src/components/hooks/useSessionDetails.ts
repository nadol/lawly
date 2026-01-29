import { useState, useEffect } from 'react';
import type { SessionDetailResponse, QuestionsListResponse } from '@/types';
import type {
  SessionDetailViewModel,
  SessionDetailsState,
  UseSessionDetailsReturn,
  QAItemViewModel,
} from '@/components/session-details/types';

/**
 * Custom hook for managing session details view state.
 * Fetches session data and questions in parallel, transforms to ViewModel,
 * and handles clipboard operations.
 */
export function useSessionDetails(sessionId: string): UseSessionDetailsReturn {
  const [state, setState] = useState<SessionDetailsState>('loading');
  const [session, setSession] = useState<SessionDetailViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  /**
   * Fetches session and questions data in parallel, then transforms to ViewModel.
   */
  async function fetchSessionDetails() {
    try {
      setState('loading');
      setError(null);

      // Parallel fetch for performance
      const [sessionRes, questionsRes] = await Promise.all([
        fetch(`/api/sessions/${sessionId}`),
        fetch('/api/questions'),
      ]);

      // Handle 401 - redirect to login
      if (sessionRes.status === 401 || questionsRes.status === 401) {
        window.location.assign('/login');
        return;
      }

      // Handle 404 - session not found
      if (sessionRes.status === 404) {
        setState('not-found');
        setError('Nie znaleziono sesji lub nie masz do niej dostępu.');
        return;
      }

      // Handle other errors
      if (!sessionRes.ok || !questionsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const sessionData: SessionDetailResponse = await sessionRes.json();
      const questionsData: QuestionsListResponse = await questionsRes.json();

      // Transform to ViewModel
      const viewModel = transformToViewModel(sessionData, questionsData.questions);
      setSession(viewModel);
      setState('success');
    } catch (err) {
      console.error('Session details fetch error:', err);
      setError('Nie można załadować szczegółów sesji. Spróbuj ponownie.');
      setState('error');
    }
  }

  /**
   * Transforms API responses to SessionDetailViewModel.
   * Joins session answers with questions data to create Q&A pairs.
   */
  function transformToViewModel(
    sessionData: SessionDetailResponse,
    questions: QuestionsListResponse['questions']
  ): SessionDetailViewModel {
    // Create a map of question_id -> question for quick lookup
    const questionsMap = new Map(questions.map((q) => [q.id, q]));

    // Transform answers to Q&A pairs
    const qaItems: QAItemViewModel[] = sessionData.answers
      .map((answer): QAItemViewModel | null => {
        const question = questionsMap.get(answer.question_id);
        if (!question) {
          console.warn(`Question not found for answer: ${answer.question_id}`);
          return null;
        }

        const answerOption = question.options.find((opt) => opt.id === answer.answer_id);
        if (!answerOption) {
          console.warn(
            `Answer option not found: ${answer.answer_id} for question ${answer.question_id}`
          );
          return null;
        }

        return {
          questionNumber: question.question_order,
          questionId: question.id,
          questionText: question.question_text,
          answerText: answerOption.text,
        };
      })
      .filter((item): item is QAItemViewModel => item !== null)
      .sort((a, b) => a.questionNumber - b.questionNumber);

    // Format date in Polish locale
    const completedDate = new Date(sessionData.completed_at);
    const formattedDate = completedDate.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      id: sessionData.id,
      formattedDate,
      completedAt: sessionData.completed_at,
      qaItems,
      fragments: sessionData.generated_fragments,
    };
  }

  /**
   * Copies all fragments to clipboard with 2-second success feedback.
   */
  async function copyToClipboard() {
    if (!session || session.fragments.length === 0) {
      return;
    }

    try {
      const text = session.fragments.join('\n\n');
      await navigator.clipboard.writeText(text);
      setIsCopied(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Silent failure - no user feedback for clipboard errors
    }
  }

  /**
   * Navigates back to dashboard.
   */
  function navigateToDashboard() {
    window.location.assign('/');
  }

  return {
    state,
    session,
    error,
    isCopied,
    copyToClipboard,
    navigateToDashboard,
  };
}
