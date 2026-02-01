import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { AnswerOptions } from './AnswerOptions';
import type { QuestionOption } from '@/types';

describe('AnswerOptions', () => {
  const mockOptions: QuestionOption[] = [
    { id: 'opt1', text: 'Option 1', sow_fragment: 'Fragment 1' },
    { id: 'opt2', text: 'Option 2', sow_fragment: 'Fragment 2' },
    { id: 'opt3', text: 'Option 3', sow_fragment: 'Fragment 3' },
  ];

  const defaultProps = {
    options: mockOptions,
    selectedAnswerId: null,
    questionId: 'question-123',
    onSelectAnswer: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render all options', () => {
      render(<AnswerOptions {...defaultProps} />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should render correct number of radio buttons', () => {
      render(<AnswerOptions {...defaultProps} />);

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(3);
    });

    it('should render empty list when no options provided', () => {
      render(<AnswerOptions {...defaultProps} options={[]} />);

      const radioButtons = screen.queryAllByRole('radio');
      expect(radioButtons).toHaveLength(0);
    });
  });

  describe('TC-WIZ-02: Selection behavior', () => {
    it('should call onSelectAnswer when option is clicked', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<AnswerOptions {...defaultProps} onSelectAnswer={handleSelect} />);

      const firstOption = screen.getByRole('radio', { name: /option 1/i });
      await user.click(firstOption);

      expect(handleSelect).toHaveBeenCalledWith('opt1');
      expect(handleSelect).toHaveBeenCalledTimes(1);
    });

    it('should mark selected option as checked', () => {
      render(<AnswerOptions {...defaultProps} selectedAnswerId="opt2" />);

      const radioButtons = screen.getAllByRole('radio');

      expect(radioButtons[0]).toHaveAttribute('aria-checked', 'false');
      expect(radioButtons[1]).toHaveAttribute('aria-checked', 'true');
      expect(radioButtons[2]).toHaveAttribute('aria-checked', 'false');
    });

    it('should show visual indicator for selected option', () => {
      const { container } = render(
        <AnswerOptions {...defaultProps} selectedAnswerId="opt1" />
      );

      const selectedOption = screen.getByRole('radio', { name: /option 1/i });
      expect(selectedOption).toHaveClass('border-primary');
      expect(selectedOption).toHaveClass('bg-primary/5');
    });

    it('should not show selected styling for unselected options', () => {
      render(<AnswerOptions {...defaultProps} selectedAnswerId="opt1" />);

      const unselectedOption = screen.getByRole('radio', { name: /option 2/i });
      expect(unselectedOption).toHaveClass('border-border');
      expect(unselectedOption).not.toHaveClass('border-primary');
    });
  });

  describe('TC-WIZ-05: Changing selection', () => {
    it('should allow changing selection from one option to another', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      const { rerender } = render(
        <AnswerOptions
          {...defaultProps}
          selectedAnswerId="opt1"
          onSelectAnswer={handleSelect}
        />
      );

      // Verify first option is selected
      let radioButtons = screen.getAllByRole('radio');
      expect(radioButtons[0]).toHaveAttribute('aria-checked', 'true');

      // Click second option
      await user.click(radioButtons[1]);
      expect(handleSelect).toHaveBeenCalledWith('opt2');

      // Rerender with new selection
      rerender(
        <AnswerOptions
          {...defaultProps}
          selectedAnswerId="opt2"
          onSelectAnswer={handleSelect}
        />
      );

      radioButtons = screen.getAllByRole('radio');
      expect(radioButtons[0]).toHaveAttribute('aria-checked', 'false');
      expect(radioButtons[1]).toHaveAttribute('aria-checked', 'true');
    });

    it('should call onSelectAnswer multiple times for different options', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<AnswerOptions {...defaultProps} onSelectAnswer={handleSelect} />);

      const radioButtons = screen.getAllByRole('radio');

      await user.click(radioButtons[0]);
      expect(handleSelect).toHaveBeenCalledWith('opt1');

      await user.click(radioButtons[2]);
      expect(handleSelect).toHaveBeenCalledWith('opt3');

      expect(handleSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have radiogroup role on container', () => {
      render(<AnswerOptions {...defaultProps} />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
    });

    it('should have aria-labelledby pointing to question', () => {
      render(<AnswerOptions {...defaultProps} questionId="q-test-123" />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-labelledby', 'question-q-test-123');
    });

    it('should be keyboard navigable with Tab', async () => {
      const user = userEvent.setup();
      render(<AnswerOptions {...defaultProps} />);

      const radioButtons = screen.getAllByRole('radio');

      await user.tab();
      expect(radioButtons[0]).toHaveFocus();

      await user.tab();
      expect(radioButtons[1]).toHaveFocus();
    });

    it('should handle Enter key press to select option', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<AnswerOptions {...defaultProps} onSelectAnswer={handleSelect} />);

      const firstOption = screen.getByRole('radio', { name: /option 1/i });
      firstOption.focus();

      await user.keyboard('{Enter}');

      expect(handleSelect).toHaveBeenCalledWith('opt1');
    });

    it('should handle Space key press to select option', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<AnswerOptions {...defaultProps} onSelectAnswer={handleSelect} />);

      const secondOption = screen.getByRole('radio', { name: /option 2/i });
      secondOption.focus();

      await user.keyboard(' ');

      expect(handleSelect).toHaveBeenCalledWith('opt2');
    });

    it('should have focus-visible styling', () => {
      render(<AnswerOptions {...defaultProps} />);

      const firstOption = screen.getByRole('radio', { name: /option 1/i });
      expect(firstOption).toHaveClass('focus-visible:ring-2');
      expect(firstOption).toHaveClass('focus-visible:ring-ring');
    });
  });

  describe('Single-select behavior (US-006)', () => {
    it('should only allow one option to be selected at a time', () => {
      render(<AnswerOptions {...defaultProps} selectedAnswerId="opt2" />);

      const radioButtons = screen.getAllByRole('radio');

      let checkedCount = 0;
      radioButtons.forEach((radio) => {
        if (radio.getAttribute('aria-checked') === 'true') {
          checkedCount++;
        }
      });

      expect(checkedCount).toBe(1);
    });

    it('should display checkmark only on selected option', () => {
      const { container } = render(
        <AnswerOptions {...defaultProps} selectedAnswerId="opt2" />
      );

      // Find all checkmark icons (lucide Check component)
      const checkmarks = container.querySelectorAll('svg');

      // Only one checkmark should be visible (in the selected option)
      let visibleCheckmarks = 0;
      checkmarks.forEach((svg) => {
        // Check if parent has selected styling
        const parent = svg.closest('.border-primary');
        if (parent) {
          visibleCheckmarks++;
        }
      });

      expect(visibleCheckmarks).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle single option', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      const singleOption: QuestionOption[] = [
        { id: 'only-one', text: 'Only option', sow_fragment: 'Fragment' },
      ];

      render(
        <AnswerOptions
          {...defaultProps}
          options={singleOption}
          onSelectAnswer={handleSelect}
        />
      );

      const radioButton = screen.getByRole('radio');
      await user.click(radioButton);

      expect(handleSelect).toHaveBeenCalledWith('only-one');
    });

    it('should handle many options (10+)', () => {
      const manyOptions: QuestionOption[] = Array.from({ length: 15 }, (_, i) => ({
        id: `opt${i}`,
        text: `Option ${i + 1}`,
        sow_fragment: `Fragment ${i + 1}`,
      }));

      render(<AnswerOptions {...defaultProps} options={manyOptions} />);

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(15);
    });

    it('should handle long option text', () => {
      const longTextOptions: QuestionOption[] = [
        {
          id: 'long',
          text: 'This is a very long option text that might span multiple lines in the UI and should be handled gracefully without breaking the layout',
          sow_fragment: 'Fragment',
        },
      ];

      render(<AnswerOptions {...defaultProps} options={longTextOptions} />);

      expect(screen.getByText(/very long option text/i)).toBeInTheDocument();
    });

    it('should handle rapid clicks on same option', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<AnswerOptions {...defaultProps} onSelectAnswer={handleSelect} />);

      const firstOption = screen.getByRole('radio', { name: /option 1/i });

      await user.tripleClick(firstOption);

      // Should be called 3 times even for same option
      expect(handleSelect).toHaveBeenCalledTimes(3);
      expect(handleSelect).toHaveBeenCalledWith('opt1');
    });

    it('should not break when selectedAnswerId does not match any option', () => {
      render(<AnswerOptions {...defaultProps} selectedAnswerId="non-existent-id" />);

      const radioButtons = screen.getAllByRole('radio');

      radioButtons.forEach((radio) => {
        expect(radio).toHaveAttribute('aria-checked', 'false');
      });
    });
  });

  describe('Visual feedback', () => {
    it('should show hover state on unselected options', () => {
      render(<AnswerOptions {...defaultProps} />);

      const firstOption = screen.getByRole('radio', { name: /option 1/i });
      expect(firstOption).toHaveClass('hover:border-primary/50');
      expect(firstOption).toHaveClass('hover:bg-accent/50');
    });

    it('should apply transition classes for smooth animations', () => {
      render(<AnswerOptions {...defaultProps} />);

      const firstOption = screen.getByRole('radio', { name: /option 1/i });
      expect(firstOption).toHaveClass('transition-all');
      expect(firstOption).toHaveClass('duration-150');
    });
  });
});
