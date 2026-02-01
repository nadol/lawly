import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { QuestionCard } from './QuestionCard';

describe('QuestionCard', () => {
  describe('Rendering', () => {
    it('should render question text', () => {
      render(<QuestionCard questionText="What is your project timeline?" />);

      expect(screen.getByText('What is your project timeline?')).toBeInTheDocument();
    });

    it('should render as h2 heading', () => {
      render(<QuestionCard questionText="Test question" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test question');
    });

    it('should have proper semantic styling', () => {
      const { container } = render(<QuestionCard questionText="Test question" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-xl');
      expect(heading).toHaveClass('font-semibold');
      expect(heading).toHaveClass('leading-relaxed');
      expect(heading).toHaveClass('text-foreground');
    });
  });

  describe('Content variations', () => {
    it('should render short question text', () => {
      render(<QuestionCard questionText="Yes or No?" />);

      expect(screen.getByText('Yes or No?')).toBeInTheDocument();
    });

    it('should render long question text', () => {
      const longQuestion =
        'This is a very long question text that spans multiple lines and contains detailed information about what the user should consider when selecting their answer option from the available choices below?';

      render(<QuestionCard questionText={longQuestion} />);

      expect(screen.getByText(longQuestion)).toBeInTheDocument();
    });

    it('should render question with special characters', () => {
      const questionWithSpecialChars =
        'What is your company\'s revenue? (e.g., $100k-$500k)';

      render(<QuestionCard questionText={questionWithSpecialChars} />);

      expect(screen.getByText(questionWithSpecialChars)).toBeInTheDocument();
    });

    it('should render question with HTML entities', () => {
      const questionWithEntities = 'What is the project scope & timeline?';

      render(<QuestionCard questionText={questionWithEntities} />);

      expect(screen.getByText(questionWithEntities)).toBeInTheDocument();
    });

    it('should render multiline question text properly', () => {
      const multilineQuestion = `What is your preferred
      deployment strategy for this project?`;

      render(<QuestionCard questionText={multilineQuestion} />);

      // Use regex to match text that might be split across elements
      expect(screen.getByText(/What is your preferred.*deployment strategy/i)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      render(<QuestionCard questionText="" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('');
    });

    it('should handle whitespace-only text', () => {
      render(<QuestionCard questionText="   " />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('should handle question text with numbers', () => {
      render(<QuestionCard questionText="How many developers will work on this project? (1-10, 11-50, 50+)" />);

      expect(
        screen.getByText(/How many developers will work on this project/)
      ).toBeInTheDocument();
    });

    it('should handle question text with punctuation', () => {
      render(<QuestionCard questionText="What's your budget? $10,000-$50,000?" />);

      expect(screen.getByText(/What's your budget/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic heading element', () => {
      render(<QuestionCard questionText="Accessible question" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.tagName).toBe('H2');
    });

    it('should be readable with proper text color', () => {
      render(<QuestionCard questionText="Test" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-foreground');
    });

    it('should have relaxed line height for readability', () => {
      render(<QuestionCard questionText="Test" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('leading-relaxed');
    });
  });

  describe('Styling', () => {
    it('should have proper container padding', () => {
      const { container } = render(<QuestionCard questionText="Test" />);

      const wrapper = container.querySelector('.py-4');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have appropriate font size', () => {
      render(<QuestionCard questionText="Test" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-xl');
    });

    it('should have semibold font weight', () => {
      render(<QuestionCard questionText="Test" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('font-semibold');
    });
  });

  describe('Component behavior', () => {
    it('should be a memoized component', () => {
      const { rerender } = render(<QuestionCard questionText="Original question" />);

      expect(screen.getByText('Original question')).toBeInTheDocument();

      // Rerender with same props should use memoized version
      rerender(<QuestionCard questionText="Original question" />);

      expect(screen.getByText('Original question')).toBeInTheDocument();
    });

    it('should update when questionText prop changes', () => {
      const { rerender } = render(<QuestionCard questionText="First question" />);

      expect(screen.getByText('First question')).toBeInTheDocument();

      rerender(<QuestionCard questionText="Second question" />);

      expect(screen.queryByText('First question')).not.toBeInTheDocument();
      expect(screen.getByText('Second question')).toBeInTheDocument();
    });
  });

  describe('Real-world question examples (PRD)', () => {
    it('should render project scope question', () => {
      render(<QuestionCard questionText="What is the scope of your project?" />);

      expect(screen.getByText('What is the scope of your project?')).toBeInTheDocument();
    });

    it('should render timeline question', () => {
      render(<QuestionCard questionText="What is your expected project timeline?" />);

      expect(
        screen.getByText('What is your expected project timeline?')
      ).toBeInTheDocument();
    });

    it('should render budget question', () => {
      render(<QuestionCard questionText="What is your project budget range?" />);

      expect(screen.getByText('What is your project budget range?')).toBeInTheDocument();
    });

    it('should render team size question', () => {
      render(<QuestionCard questionText="How many team members will be involved?" />);

      expect(
        screen.getByText('How many team members will be involved?')
      ).toBeInTheDocument();
    });

    it('should render technical requirements question', () => {
      render(
        <QuestionCard questionText="What are the main technical requirements for this project?" />
      );

      expect(
        screen.getByText('What are the main technical requirements for this project?')
      ).toBeInTheDocument();
    });
  });
});
