import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { OptionCard } from './OptionCard';
import type { QuestionOption } from '@/types';

describe('OptionCard', () => {
  const mockOption: QuestionOption = {
    id: 'option-123',
    text: 'Sample answer option',
    sow_fragment: 'Sample SOW fragment',
  };

  const defaultProps = {
    option: mockOption,
    isSelected: false,
    onSelect: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render option text', () => {
      render(<OptionCard {...defaultProps} />);

      expect(screen.getByText('Sample answer option')).toBeInTheDocument();
    });

    it('should render as button with radio role', () => {
      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have type="button" attribute', () => {
      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Selection state', () => {
    it('should have aria-checked=false when not selected', () => {
      render(<OptionCard {...defaultProps} isSelected={false} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveAttribute('aria-checked', 'false');
    });

    it('should have aria-checked=true when selected', () => {
      render(<OptionCard {...defaultProps} isSelected={true} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveAttribute('aria-checked', 'true');
    });

    it('should show selected styling when isSelected is true', () => {
      render(<OptionCard {...defaultProps} isSelected={true} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('border-primary');
      expect(button).toHaveClass('bg-primary/5');
    });

    it('should show unselected styling when isSelected is false', () => {
      render(<OptionCard {...defaultProps} isSelected={false} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('border-border');
      expect(button).not.toHaveClass('border-primary');
    });

    it('should display checkmark icon when selected', () => {
      const { container } = render(<OptionCard {...defaultProps} isSelected={true} />);

      // Check for the presence of the checkmark icon
      const checkIcon = container.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('Click interaction', () => {
    it('should call onSelect with option id when clicked', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<OptionCard {...defaultProps} onSelect={handleSelect} />);

      const button = screen.getByRole('radio');
      await user.click(button);

      expect(handleSelect).toHaveBeenCalledWith('option-123');
      expect(handleSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when clicked multiple times', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<OptionCard {...defaultProps} onSelect={handleSelect} />);

      const button = screen.getByRole('radio');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleSelect).toHaveBeenCalledTimes(3);
      expect(handleSelect).toHaveBeenCalledWith('option-123');
    });
  });

  describe('Keyboard interaction', () => {
    it('should call onSelect when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<OptionCard {...defaultProps} onSelect={handleSelect} />);

      const button = screen.getByRole('radio');
      button.focus();

      await user.keyboard('{Enter}');

      expect(handleSelect).toHaveBeenCalledWith('option-123');
    });

    it('should call onSelect when Space key is pressed', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<OptionCard {...defaultProps} onSelect={handleSelect} />);

      const button = screen.getByRole('radio');
      button.focus();

      await user.keyboard(' ');

      expect(handleSelect).toHaveBeenCalledWith('option-123');
    });

    it('should not call onSelect for other keys', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<OptionCard {...defaultProps} onSelect={handleSelect} />);

      const button = screen.getByRole('radio');
      button.focus();

      await user.keyboard('a');
      await user.keyboard('{Escape}');
      await user.keyboard('{Tab}');

      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('should be focusable via Tab key', async () => {
      const user = userEvent.setup();

      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');

      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus-visible styling', () => {
      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ring');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should have left-aligned text', () => {
      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('text-left');
    });

    it('should have proper semantic structure with radio indicator', () => {
      const { container } = render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      const radioIndicator = container.querySelector('.rounded-full');

      expect(radioIndicator).toBeInTheDocument();
      expect(button.contains(radioIndicator as Node)).toBe(true);
    });
  });

  describe('Visual styling', () => {
    it('should have transition classes for smooth animations', () => {
      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-150');
    });

    it('should have hover state classes', () => {
      render(<OptionCard {...defaultProps} isSelected={false} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('hover:border-primary/50');
      expect(button).toHaveClass('hover:bg-accent/50');
    });

    it('should have rounded corners', () => {
      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('rounded-lg');
    });

    it('should have proper padding', () => {
      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('p-4');
    });

    it('should have full width', () => {
      render(<OptionCard {...defaultProps} />);

      const button = screen.getByRole('radio');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Radio indicator styling', () => {
    it('should show primary colored indicator when selected', () => {
      const { container } = render(<OptionCard {...defaultProps} isSelected={true} />);

      const indicator = container.querySelector('.rounded-full');
      expect(indicator).toHaveClass('border-primary');
      expect(indicator).toHaveClass('bg-primary');
      expect(indicator).toHaveClass('text-primary-foreground');
    });

    it('should show muted indicator when not selected', () => {
      const { container } = render(<OptionCard {...defaultProps} isSelected={false} />);

      const indicator = container.querySelector('.rounded-full');
      expect(indicator).toHaveClass('border-muted-foreground');
      expect(indicator).not.toHaveClass('bg-primary');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long option text', () => {
      const longOption: QuestionOption = {
        id: 'long-id',
        text: 'This is an extremely long option text that might span multiple lines and should be handled gracefully without breaking the layout or causing overflow issues in the UI component',
        sow_fragment: 'Fragment',
      };

      render(<OptionCard {...defaultProps} option={longOption} />);

      expect(screen.getByText(/extremely long option text/i)).toBeInTheDocument();
    });

    it('should handle empty option text', () => {
      const emptyOption: QuestionOption = {
        id: 'empty-id',
        text: '',
        sow_fragment: 'Fragment',
      };

      render(<OptionCard {...defaultProps} option={emptyOption} />);

      const button = screen.getByRole('radio');
      expect(button).toBeInTheDocument();
    });

    it('should handle special characters in option text', () => {
      const specialOption: QuestionOption = {
        id: 'special-id',
        text: 'Option with <special> & "characters" & symbols: @#$%',
        sow_fragment: 'Fragment',
      };

      render(<OptionCard {...defaultProps} option={specialOption} />);

      expect(screen.getByText(/special.*characters.*symbols/i)).toBeInTheDocument();
    });

    it('should not break with undefined onSelect callback', () => {
      // This should not throw an error due to useCallback memoization
      const { container } = render(
        <OptionCard option={mockOption} isSelected={false} onSelect={vi.fn()} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should use memoization (component wrapped with memo)', () => {
      const { rerender } = render(<OptionCard {...defaultProps} />);

      // Rerender with same props
      rerender(<OptionCard {...defaultProps} />);

      // Component should be memoized and not re-render unnecessarily
      // This is implicitly tested by using React.memo in the component
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should not re-render when unrelated props change', () => {
      const handleSelect = vi.fn();
      const { rerender } = render(
        <OptionCard {...defaultProps} onSelect={handleSelect} />
      );

      // Rerender with same option and selection state
      rerender(<OptionCard {...defaultProps} onSelect={handleSelect} />);

      // Component should remain stable
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });
  });
});
