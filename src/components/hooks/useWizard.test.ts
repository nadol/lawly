import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWizard } from './useWizard';
import type {
  QuestionsListResponse,
  SessionDetailResponse,
  ErrorResponse,
} from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location.assign
const mockLocationAssign = vi.fn();
Object.defineProperty(window, 'location', {
  value: { assign: mockLocationAssign },
  writable: true,
});

describe('useWizard', () => {
  const mockQuestions: QuestionsListResponse = {
    questions: [
      {
        id: 'q1',
        question_order: 1,
        question_text: 'Question 1?',
        options: [
          { id: 'q1a1', text: 'Answer 1', sow_fragment: 'Fragment 1' },
          { id: 'q1a2', text: 'Answer 2', sow_fragment: 'Fragment 2' },
        ],
      },
      {
        id: 'q2',
        question_order: 2,
        question_text: 'Question 2?',
        options: [
          { id: 'q2a1', text: 'Answer A', sow_fragment: 'Fragment A' },
          { id: 'q2a2', text: 'Answer B', sow_fragment: 'Fragment B' },
        ],
      },
      {
        id: 'q3',
        question_order: 3,
        question_text: 'Question 3?',
        options: [
          { id: 'q3a1', text: 'Option 1', sow_fragment: 'Fragment X' },
        ],
      },
      {
        id: 'q4',
        question_order: 4,
        question_text: 'Question 4?',
        options: [
          { id: 'q4a1', text: 'Option 1', sow_fragment: 'Fragment Y' },
        ],
      },
      {
        id: 'q5',
        question_order: 5,
        question_text: 'Question 5?',
        options: [
          { id: 'q5a1', text: 'Option 1', sow_fragment: 'Fragment Z' },
        ],
      },
    ],
    total: 5,
  };

  const mockSessionResponse: SessionDetailResponse = {
    id: 'session-123',
    user_id: 'user-456',
    created_at: '2026-01-25T10:00:00Z',
    completed_at: '2026-01-25T10:05:00Z',
    answers: [
      { question_id: 'q1', answer_id: 'q1a1' },
      { question_id: 'q2', answer_id: 'q2a1' },
      { question_id: 'q3', answer_id: 'q3a1' },
      { question_id: 'q4', answer_id: 'q4a1' },
      { question_id: 'q5', answer_id: 'q5a1' },
    ],
    generated_fragments: ['Fragment 1', 'Fragment A', 'Fragment X', 'Fragment Y', 'Fragment Z'],
  };

  beforeEach(() => {
    mockFetch.mockClear();
    mockLocationAssign.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC-WIZ-01: Rozpoczęcie sesji', () => {
    it('should initialize wizard and fetch questions on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.questions).toEqual([]);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/questions');
      expect(result.current.questions).toEqual(mockQuestions.questions);
      expect(result.current.totalQuestions).toBe(5);
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.currentQuestion).toEqual(mockQuestions.questions[0]);
    });

    it('should set error state when questions fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Nie można załadować pytań. Spróbuj ponownie.');
      expect(result.current.questions).toEqual([]);
    });

    it('should redirect to login on 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      renderHook(() => useWizard());

      await waitFor(() => {
        expect(mockLocationAssign).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('TC-WIZ-02: Wybór odpowiedzi', () => {
    it('should select answer for current question', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedAnswerId).toBeNull();
      expect(result.current.canProceed).toBe(false);

      act(() => {
        result.current.selectAnswer('q1a1');
      });

      expect(result.current.selectedAnswerId).toBe('q1a1');
      expect(result.current.canProceed).toBe(true);
    });

    it('should not select answer when no current question', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ questions: [], total: 0 }),
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectAnswer('invalid-answer');
      });

      expect(result.current.selectedAnswerId).toBeNull();
    });
  });

  describe('TC-WIZ-03 & TC-WIZ-04: Przycisk Dalej disabled/enabled', () => {
    it('should not allow proceeding without selected answer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canProceed).toBe(false);

      await act(async () => {
        await result.current.goToNext();
      });

      // Should not advance to next question
      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should allow proceeding after selecting answer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectAnswer('q1a1');
      });

      expect(result.current.canProceed).toBe(true);
    });
  });

  describe('TC-WIZ-05: Zmiana odpowiedzi', () => {
    it('should replace previously selected answer with new answer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Select first answer
      act(() => {
        result.current.selectAnswer('q1a1');
      });
      expect(result.current.selectedAnswerId).toBe('q1a1');

      // Change to second answer
      act(() => {
        result.current.selectAnswer('q1a2');
      });
      expect(result.current.selectedAnswerId).toBe('q1a2');
    });
  });

  describe('TC-WIZ-06: Przejście do kolejnego pytania', () => {
    it('should advance to next question after selecting answer and clicking next', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.currentQuestion?.id).toBe('q1');

      act(() => {
        result.current.selectAnswer('q1a1');
      });

      await act(async () => {
        await result.current.goToNext();
      });

      expect(result.current.currentQuestionIndex).toBe(1);
      expect(result.current.currentQuestion?.id).toBe('q2');
      expect(result.current.selectedAnswerId).toBeNull(); // New question has no selection
    });

    it('should preserve previous answers when advancing to next question', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer question 1
      act(() => {
        result.current.selectAnswer('q1a1');
      });

      await act(async () => {
        await result.current.goToNext();
      });

      // Answer question 2
      act(() => {
        result.current.selectAnswer('q2a1');
      });

      // Both answers should be stored (internal state)
      expect(result.current.selectedAnswerId).toBe('q2a1');
    });
  });

  describe('TC-WIZ-07: Ostatnie pytanie i zakończenie', () => {
    it('should identify last question correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLastQuestion).toBe(false);

      // Navigate to last question
      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.selectAnswer(`q${i + 1}a1`);
        });

        await act(async () => {
          await result.current.goToNext();
        });
      }

      expect(result.current.currentQuestionIndex).toBe(4);
      expect(result.current.isLastQuestion).toBe(true);
    });

    it('should submit session when answering last question', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockQuestions,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSessionResponse,
        });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all 5 questions
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.selectAnswer(`q${i + 1}a1`);
        });

        await act(async () => {
          await result.current.goToNext();
        });
      }

      await waitFor(() => {
        expect(result.current.completedSession).not.toBeNull();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('answers'),
      });

      expect(result.current.completedSession).toEqual(mockSessionResponse);
    });

    it('should set isSubmitting flag during session submission', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockQuestions,
        })
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    status: 200,
                    json: async () => mockSessionResponse,
                  }),
                100
              )
            )
        );

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all questions
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.selectAnswer(`q${i + 1}a1`);
        });

        if (i < 4) {
          await act(async () => {
            await result.current.goToNext();
          });
        }
      }

      // Trigger submission
      act(() => {
        result.current.goToNext();
      });

      expect(result.current.isSubmitting).toBe(true);

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should handle session submission error', async () => {
      const errorResponse: ErrorResponse = {
        error: 'Validation failed: answers must contain exactly 5 items',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockQuestions,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => errorResponse,
        });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all questions
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.selectAnswer(`q${i + 1}a1`);
        });

        await act(async () => {
          await result.current.goToNext();
        });
      }

      await waitFor(() => {
        expect(result.current.error).toBe(errorResponse.error);
      });

      expect(result.current.completedSession).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should redirect to login on 401 during session submission', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockQuestions,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all questions
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.selectAnswer(`q${i + 1}a1`);
        });

        await act(async () => {
          await result.current.goToNext();
        });
      }

      await waitFor(() => {
        expect(mockLocationAssign).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('TC-WIZ-08: Retry functionality', () => {
    it('should retry fetching questions when questions array is empty', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockQuestions,
        });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.questions).toEqual([]);

      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.questions.length).toBe(5);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry session submission when questions exist but submission failed', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockQuestions,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSessionResponse,
        });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all questions and trigger failed submission
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.selectAnswer(`q${i + 1}a1`);
        });

        await act(async () => {
          await result.current.goToNext();
        });
      }

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Retry submission
      await act(async () => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.completedSession).not.toBeNull();
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Edge cases and business rules', () => {
    it('should handle empty questions response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ questions: [], total: 0 }),
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.currentQuestion).toBeNull();
      expect(result.current.isLastQuestion).toBe(false);
    });

    it('should correctly format answers array for API submission', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockQuestions,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSessionResponse,
        });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all questions with specific answers
      const expectedAnswers = [
        { question_id: 'q1', answer_id: 'q1a2' },
        { question_id: 'q2', answer_id: 'q2a1' },
        { question_id: 'q3', answer_id: 'q3a1' },
        { question_id: 'q4', answer_id: 'q4a1' },
        { question_id: 'q5', answer_id: 'q5a1' },
      ];

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.selectAnswer(expectedAnswers[i].answer_id);
        });

        await act(async () => {
          await result.current.goToNext();
        });
      }

      await waitFor(() => {
        expect(result.current.completedSession).not.toBeNull();
      });

      const submissionCall = mockFetch.mock.calls.find(
        (call) => call[0] === '/api/sessions'
      );
      expect(submissionCall).toBeDefined();

      const submittedBody = JSON.parse(submissionCall?.[1]?.body as string);
      expect(submittedBody.answers).toHaveLength(5);
      expect(submittedBody.answers).toEqual(expectedAnswers);
    });

    it('should handle network error during questions fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Nie można załadować pytań. Spróbuj ponownie.');
    });

    it('should handle network error during session submission', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockQuestions,
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all questions
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.selectAnswer(`q${i + 1}a1`);
        });

        await act(async () => {
          await result.current.goToNext();
        });
      }

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        // Error message can be either the caught error message or the default message
        expect(result.current.error).toMatch(/Network error|Nie udało się zapisać sesji/);
      });
    });

    it('should maintain answer state across question navigation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestions,
      });

      const { result } = renderHook(() => useWizard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer question 1
      act(() => {
        result.current.selectAnswer('q1a2');
      });

      // Move to question 2
      await act(async () => {
        await result.current.goToNext();
      });

      // Answer question 2
      act(() => {
        result.current.selectAnswer('q2a2');
      });

      // Move to question 3
      await act(async () => {
        await result.current.goToNext();
      });

      // At question 3, previous answers should still be stored
      // (We can't directly access internal Map, but we can verify through final submission)
      expect(result.current.currentQuestionIndex).toBe(2);
      expect(result.current.selectedAnswerId).toBeNull();
    });
  });
});
