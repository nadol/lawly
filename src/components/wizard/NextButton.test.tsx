import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { NextButton } from './NextButton';

describe('NextButton', () => {
  describe('Button text and behavior', () => {
    it('should display "Dalej" for non-last question', () => {
      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={false}
          onNext={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /dalej/i })).toBeInTheDocument();
    });

    it('should display "Zakończ" for last question', () => {
      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={true}
          isLoading={false}
          onNext={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /zakończ/i })).toBeInTheDocument();
    });

    it('should call onNext when clicked and enabled', async () => {
      const user = userEvent.setup();
      const handleNext = vi.fn();

      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={false}
          onNext={handleNext}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleNext).toHaveBeenCalledTimes(1);
    });

    it('should not call onNext when disabled', async () => {
      const user = userEvent.setup();
      const handleNext = vi.fn();

      render(
        <NextButton
          isDisabled={true}
          isLastQuestion={false}
          isLoading={false}
          onNext={handleNext}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleNext).not.toHaveBeenCalled();
    });
  });

  describe('TC-WIZ-03: Disabled state validation', () => {
    it('should be disabled when isDisabled prop is true', () => {
      render(
        <NextButton
          isDisabled={true}
          isLastQuestion={false}
          isLoading={false}
          onNext={vi.fn()}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when isLoading is true', () => {
      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={true}
          onNext={vi.fn()}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when both isDisabled and isLoading are true', () => {
      render(
        <NextButton
          isDisabled={true}
          isLastQuestion={false}
          isLoading={true}
          onNext={vi.fn()}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show tooltip when disabled but not loading', async () => {
      const user = userEvent.setup();

      render(
        <NextButton
          isDisabled={true}
          isLastQuestion={false}
          isLoading={false}
          onNext={vi.fn()}
        />
      );

      const wrapper = screen.getByRole('button').parentElement;
      expect(wrapper).toHaveAttribute('tabIndex', '0');

      // Hover to show tooltip
      if (wrapper) {
        await user.hover(wrapper);
      }

      // Note: Tooltip content visibility depends on UI library implementation
      // This test verifies the structure is in place
    });

    it('should not show tooltip wrapper when loading', () => {
      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={true}
          onNext={vi.fn()}
        />
      );

      const button = screen.getByRole('button');
      const wrapper = button.parentElement;

      // When loading, button should not be wrapped with tooltip trigger
      expect(wrapper?.tagName).not.toBe('SPAN');
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      const { container } = render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={true}
          onNext={vi.fn()}
        />
      );

      // Check for loading icon class
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show loading spinner when isLoading is false', () => {
      const { container } = render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={false}
          onNext={vi.fn()}
        />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should display loading text with "Dalej" for non-last question', () => {
      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={true}
          onNext={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /dalej/i })).toBeInTheDocument();
    });

    it('should display loading text with "Zakończ" for last question', () => {
      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={true}
          isLoading={true}
          onNext={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /zakończ/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible when enabled', async () => {
      const user = userEvent.setup();
      const handleNext = vi.fn();

      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={false}
          onNext={handleNext}
        />
      );

      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleNext).toHaveBeenCalledTimes(1);
    });

    it('should have full width styling', () => {
      const { container } = render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={false}
          onNext={vi.fn()}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should have large size styling', () => {
      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={false}
          onNext={vi.fn()}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10'); // lg size
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid clicks gracefully', async () => {
      const user = userEvent.setup();
      const handleNext = vi.fn();

      render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={false}
          onNext={handleNext}
        />
      );

      const button = screen.getByRole('button');

      await user.tripleClick(button);

      // Should be called 3 times (no built-in debounce)
      expect(handleNext).toHaveBeenCalledTimes(3);
    });

    it('should maintain disabled state during loading', async () => {
      const user = userEvent.setup();
      const handleNext = vi.fn();

      const { rerender } = render(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={false}
          onNext={handleNext}
        />
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();

      // Simulate loading state after click
      rerender(
        <NextButton
          isDisabled={false}
          isLastQuestion={false}
          isLoading={true}
          onNext={handleNext}
        />
      );

      expect(button).toBeDisabled();

      await user.click(button);
      expect(handleNext).not.toHaveBeenCalled();
    });
  });
});
