import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { WizardContent } from './WizardContent';
import type { QuestionResponse } from '@/types';

// Mock child components
vi.mock('./ProgressStepper', () => ({
  ProgressStepper: ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <div data-testid="progress-stepper">
      Pytanie {currentStep} z {totalSteps}
    </div>
  ),
}));

vi.mock('./QuestionCard', () => ({
  QuestionCard: ({ questionText }: { questionText: string }) => (
    <div data-testid="question-card">{questionText}</div>
  ),
}));

vi.mock('./AnswerOptions', () => ({
  AnswerOptions: ({
    options,
    selectedAnswerId,
    onSelectAnswer,
  }: {
    options: any[];
    selectedAnswerId: string | null;
    onSelectAnswer: (id: string) => void;
  }) => (
    <div data-testid="answer-options">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelectAnswer(opt.id)}
          aria-checked={selectedAnswerId === opt.id}
        >
          {opt.text}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./NextButton', () => ({
  NextButton: ({
    isDisabled,
    isLastQuestion,
    isLoading,
    onNext,
  }: {
    isDisabled: boolean;
    isLastQuestion: boolean;
    isLoading: boolean;
    onNext: () => void;
  }) => (
    <button
      data-testid="next-button"
      disabled={isDisabled}
      onClick={onNext}
      data-loading={isLoading}
      data-last={isLastQuestion}
    >
      {isLastQuestion ? 'Zakończ' : 'Dalej'}
    </button>
  ),
}));

describe('WizardContent', () => {
  const mockQuestion: QuestionResponse = {
    id: 'q1',
    question_order: 1,
    question_text: 'What is your project scope?',
    options: [
      { id: 'a1', text: 'Small project', sow_fragment: 'Fragment 1' },
      { id: 'a2', text: 'Medium project', sow_fragment: 'Fragment 2' },
      { id: 'a3', text: 'Large project', sow_fragment: 'Fragment 3' },
    ],
  };

  const defaultProps = {
    currentQuestion: mockQuestion,
    currentQuestionIndex: 0,
    totalQuestions: 5,
    selectedAnswerId: null,
    isLastQuestion: false,
    isSubmitting: false,
    onSelectAnswer: vi.fn(),
    onNext: vi.fn(),
  };

  describe('Component composition', () => {
    it('should render all child components', () => {
      render(<WizardContent {...defaultProps} />);

      expect(screen.getByTestId('progress-stepper')).toBeInTheDocument();
      expect(screen.getByTestId('question-card')).toBeInTheDocument();
      expect(screen.getByTestId('answer-options')).toBeInTheDocument();
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
    });

    it('should render progress stepper with correct step numbers', () => {
      render(<WizardContent {...defaultProps} currentQuestionIndex={2} />);

      expect(screen.getByText('Pytanie 3 z 5')).toBeInTheDocument();
    });

    it('should render question text', () => {
      render(<WizardContent {...defaultProps} />);

      expect(screen.getByText('What is your project scope?')).toBeInTheDocument();
    });

    it('should render all answer options', () => {
      render(<WizardContent {...defaultProps} />);

      expect(screen.getByText('Small project')).toBeInTheDocument();
      expect(screen.getByText('Medium project')).toBeInTheDocument();
      expect(screen.getByText('Large project')).toBeInTheDocument();
    });
  });

  describe('Answer selection flow', () => {
    it('should call onSelectAnswer when option is clicked', async () => {
      const user = userEvent.setup();
      const handleSelectAnswer = vi.fn();

      render(<WizardContent {...defaultProps} onSelectAnswer={handleSelectAnswer} />);

      const option = screen.getByText('Small project');
      await user.click(option);

      expect(handleSelectAnswer).toHaveBeenCalledWith('a1');
    });

    it('should pass selected answer to answer options', () => {
      render(<WizardContent {...defaultProps} selectedAnswerId="a2" />);

      const answerOptions = screen.getByTestId('answer-options');
      const options = answerOptions.querySelectorAll('button');

      expect(options[0]).toHaveAttribute('aria-checked', 'false');
      expect(options[1]).toHaveAttribute('aria-checked', 'true');
      expect(options[2]).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Next button behavior', () => {
    it('should render next button as disabled when no answer selected', () => {
      render(<WizardContent {...defaultProps} selectedAnswerId={null} />);

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();
    });

    it('should render next button as enabled when answer is selected', () => {
      render(<WizardContent {...defaultProps} selectedAnswerId="a1" />);

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).not.toBeDisabled();
    });

    it('should call onNext when next button is clicked', async () => {
      const user = userEvent.setup();
      const handleNext = vi.fn();

      render(
        <WizardContent {...defaultProps} selectedAnswerId="a1" onNext={handleNext} />
      );

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      expect(handleNext).toHaveBeenCalledTimes(1);
    });

    it('should show "Dalej" text for non-last question', () => {
      render(<WizardContent {...defaultProps} isLastQuestion={false} />);

      expect(screen.getByText('Dalej')).toBeInTheDocument();
    });

    it('should show "Zakończ" text for last question', () => {
      render(<WizardContent {...defaultProps} isLastQuestion={true} />);

      expect(screen.getByText('Zakończ')).toBeInTheDocument();
    });

    it('should pass isSubmitting to next button', () => {
      render(<WizardContent {...defaultProps} isSubmitting={true} />);

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Question navigation scenarios', () => {
    it('should render first question (1 of 5)', () => {
      render(
        <WizardContent {...defaultProps} currentQuestionIndex={0} totalQuestions={5} />
      );

      expect(screen.getByText('Pytanie 1 z 5')).toBeInTheDocument();
    });

    it('should render middle question (3 of 5)', () => {
      render(
        <WizardContent {...defaultProps} currentQuestionIndex={2} totalQuestions={5} />
      );

      expect(screen.getByText('Pytanie 3 z 5')).toBeInTheDocument();
    });

    it('should render last question (5 of 5)', () => {
      render(
        <WizardContent
          {...defaultProps}
          currentQuestionIndex={4}
          totalQuestions={5}
          isLastQuestion={true}
        />
      );

      expect(screen.getByText('Pytanie 5 z 5')).toBeInTheDocument();
      expect(screen.getByText('Zakończ')).toBeInTheDocument();
    });
  });

  describe('Layout and structure', () => {
    it('should have proper container structure', () => {
      const { container } = render(<WizardContent {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('mx-auto');
      expect(wrapper).toHaveClass('max-w-2xl');
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
      expect(wrapper).toHaveClass('gap-6');
      expect(wrapper).toHaveClass('p-6');
    });

    it('should render components in correct order', () => {
      const { container } = render(<WizardContent {...defaultProps} />);

      const children = Array.from(container.firstChild?.childNodes || []);
      
      // Check that progress stepper comes first
      const progressStepper = children.find((child: any) => 
        child.getAttribute?.('data-testid') === 'progress-stepper'
      );
      expect(progressStepper).toBeTruthy();
      
      // Check that next button wrapper comes last (in mt-4 div)
      const lastChild = children[children.length - 1] as HTMLElement;
      expect(lastChild?.className).toContain('mt-4');
    });

    it('should have question ID for accessibility linking', () => {
      const { container } = render(<WizardContent {...defaultProps} />);

      const questionWrapper = container.querySelector('#question-q1');
      expect(questionWrapper).toBeInTheDocument();
    });
  });

  describe('Different question types', () => {
    it('should handle question with 2 options', () => {
      const binaryQuestion: QuestionResponse = {
        id: 'q-binary',
        question_order: 1,
        question_text: 'Yes or No?',
        options: [
          { id: 'yes', text: 'Yes', sow_fragment: 'Fragment Yes' },
          { id: 'no', text: 'No', sow_fragment: 'Fragment No' },
        ],
      };

      render(<WizardContent {...defaultProps} currentQuestion={binaryQuestion} />);

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('should handle question with many options', () => {
      const multiOptionQuestion: QuestionResponse = {
        id: 'q-multi',
        question_order: 1,
        question_text: 'Select budget range',
        options: [
          { id: 'opt1', text: '$0-$10k', sow_fragment: 'F1' },
          { id: 'opt2', text: '$10k-$50k', sow_fragment: 'F2' },
          { id: 'opt3', text: '$50k-$100k', sow_fragment: 'F3' },
          { id: 'opt4', text: '$100k-$500k', sow_fragment: 'F4' },
          { id: 'opt5', text: '$500k+', sow_fragment: 'F5' },
        ],
      };

      render(<WizardContent {...defaultProps} currentQuestion={multiOptionQuestion} />);

      expect(screen.getByText('$0-$10k')).toBeInTheDocument();
      expect(screen.getByText('$500k+')).toBeInTheDocument();
    });
  });

  describe('Complete user flow simulation', () => {
    it('should handle complete answer selection and next flow', async () => {
      const user = userEvent.setup();
      const handleSelectAnswer = vi.fn();
      const handleNext = vi.fn();

      const { rerender } = render(
        <WizardContent
          {...defaultProps}
          onSelectAnswer={handleSelectAnswer}
          onNext={handleNext}
        />
      );

      // Initially no answer selected, button disabled
      let nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();

      // Select an answer
      const option = screen.getByText('Medium project');
      await user.click(option);
      expect(handleSelectAnswer).toHaveBeenCalledWith('a2');

      // Rerender with selected answer
      rerender(
        <WizardContent
          {...defaultProps}
          selectedAnswerId="a2"
          onSelectAnswer={handleSelectAnswer}
          onNext={handleNext}
        />
      );

      // Button should now be enabled
      nextButton = screen.getByTestId('next-button');
      expect(nextButton).not.toBeDisabled();

      // Click next
      await user.click(nextButton);
      expect(handleNext).toHaveBeenCalledTimes(1);
    });

    it('should handle last question submission flow', async () => {
      const user = userEvent.setup();
      const handleSelectAnswer = vi.fn();
      const handleNext = vi.fn();

      render(
        <WizardContent
          {...defaultProps}
          currentQuestionIndex={4}
          isLastQuestion={true}
          selectedAnswerId="a1"
          onSelectAnswer={handleSelectAnswer}
          onNext={handleNext}
        />
      );

      expect(screen.getByText('Pytanie 5 z 5')).toBeInTheDocument();
      expect(screen.getByText('Zakończ')).toBeInTheDocument();

      const submitButton = screen.getByTestId('next-button');
      await user.click(submitButton);

      expect(handleNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle question with very long text', () => {
      const longQuestion: QuestionResponse = {
        ...mockQuestion,
        question_text:
          'This is an extremely long question text that might span multiple lines and needs to be displayed properly in the UI without breaking the layout or causing any overflow issues. The question should remain readable and maintain proper spacing.',
      };

      render(<WizardContent {...defaultProps} currentQuestion={longQuestion} />);

      expect(screen.getByText(/extremely long question text/i)).toBeInTheDocument();
    });

    it('should handle rapid answer changes', async () => {
      const user = userEvent.setup();
      const handleSelectAnswer = vi.fn();

      render(<WizardContent {...defaultProps} onSelectAnswer={handleSelectAnswer} />);

      const option1 = screen.getByText('Small project');
      const option2 = screen.getByText('Medium project');
      const option3 = screen.getByText('Large project');

      await user.click(option1);
      await user.click(option2);
      await user.click(option3);

      expect(handleSelectAnswer).toHaveBeenCalledTimes(3);
      expect(handleSelectAnswer).toHaveBeenNthCalledWith(1, 'a1');
      expect(handleSelectAnswer).toHaveBeenNthCalledWith(2, 'a2');
      expect(handleSelectAnswer).toHaveBeenNthCalledWith(3, 'a3');
    });
  });
});
