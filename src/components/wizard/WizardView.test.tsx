import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { WizardView } from './WizardView';
import { useWizard } from '../hooks/useWizard';
import type { UseWizardReturn } from './types';

// Mock the useWizard hook
vi.mock('../hooks/useWizard');

// Mock child components
vi.mock('./WizardSkeleton', () => ({
  WizardSkeleton: () => <div data-testid="wizard-skeleton">Loading...</div>,
}));

vi.mock('./WizardError', () => ({
  WizardError: ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div data-testid="wizard-error">
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

vi.mock('./WizardContent', () => ({
  WizardContent: () => <div data-testid="wizard-content">Wizard Content</div>,
}));

vi.mock('../results', () => ({
  FragmentResultsView: () => <div data-testid="fragment-results">Results View</div>,
}));

const mockUseWizard = vi.mocked(useWizard);

describe('WizardView', () => {
  const defaultWizardState: UseWizardReturn = {
    questions: [
      {
        id: 'q1',
        question_order: 1,
        question_text: 'Test question?',
        options: [
          { id: 'a1', text: 'Answer 1', sow_fragment: 'Fragment 1' },
          { id: 'a2', text: 'Answer 2', sow_fragment: 'Fragment 2' },
        ],
      },
    ],
    currentQuestion: {
      id: 'q1',
      question_order: 1,
      question_text: 'Test question?',
      options: [
        { id: 'a1', text: 'Answer 1', sow_fragment: 'Fragment 1' },
        { id: 'a2', text: 'Answer 2', sow_fragment: 'Fragment 2' },
      ],
    },
    currentQuestionIndex: 0,
    totalQuestions: 5,
    selectedAnswerId: null,
    isLastQuestion: false,
    canProceed: false,
    isLoading: false,
    isSubmitting: false,
    error: null,
    completedSession: null,
    selectAnswer: vi.fn(),
    goToNext: vi.fn(),
    retry: vi.fn(),
  };

  it('should render loading skeleton when isLoading is true', () => {
    mockUseWizard.mockReturnValue({
      ...defaultWizardState,
      isLoading: true,
    });

    render(<WizardView />);

    expect(screen.getByTestId('wizard-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-content')).not.toBeInTheDocument();
  });

  it('should render error component when error exists', () => {
    const errorMessage = 'Failed to load questions';
    const mockRetry = vi.fn();

    mockUseWizard.mockReturnValue({
      ...defaultWizardState,
      error: errorMessage,
      retry: mockRetry,
    });

    render(<WizardView />);

    expect(screen.getByTestId('wizard-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-content')).not.toBeInTheDocument();
  });

  it('should render error when currentQuestion is null', () => {
    mockUseWizard.mockReturnValue({
      ...defaultWizardState,
      currentQuestion: null,
      questions: [],
      totalQuestions: 0,
    });

    render(<WizardView />);

    expect(screen.getByTestId('wizard-error')).toBeInTheDocument();
    expect(screen.getByText('Nie znaleziono pytan. Sprobuj ponownie pozniej.')).toBeInTheDocument();
  });

  it('should render wizard content when questions are loaded', () => {
    mockUseWizard.mockReturnValue(defaultWizardState);

    render(<WizardView />);

    expect(screen.getByTestId('wizard-content')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('wizard-error')).not.toBeInTheDocument();
  });

  it('should render results view when session is completed', () => {
    mockUseWizard.mockReturnValue({
      ...defaultWizardState,
      completedSession: {
        id: 'session-123',
        user_id: 'user-456',
        created_at: '2026-01-25T10:00:00Z',
        completed_at: '2026-01-25T10:05:00Z',
        answers: [{ question_id: 'q1', answer_id: 'a1' }],
        generated_fragments: ['Fragment 1'],
      },
    });

    render(<WizardView />);

    expect(screen.getByTestId('fragment-results')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-content')).not.toBeInTheDocument();
  });

  it('should prioritize completed session over error state', () => {
    mockUseWizard.mockReturnValue({
      ...defaultWizardState,
      error: 'Some error',
      completedSession: {
        id: 'session-123',
        user_id: 'user-456',
        created_at: '2026-01-25T10:00:00Z',
        completed_at: '2026-01-25T10:05:00Z',
        answers: [{ question_id: 'q1', answer_id: 'a1' }],
        generated_fragments: ['Fragment 1'],
      },
    });

    render(<WizardView />);

    expect(screen.getByTestId('fragment-results')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-error')).not.toBeInTheDocument();
  });
});
