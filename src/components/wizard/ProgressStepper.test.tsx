import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { ProgressStepper } from './ProgressStepper';

describe('ProgressStepper', () => {
  it('should render current step text correctly', () => {
    render(<ProgressStepper currentStep={1} totalSteps={5} />);

    expect(screen.getByText('Pytanie 1 z 5')).toBeInTheDocument();
  });

  it('should render correct step text for middle question', () => {
    render(<ProgressStepper currentStep={3} totalSteps={5} />);

    expect(screen.getByText('Pytanie 3 z 5')).toBeInTheDocument();
  });

  it('should render correct step text for last question', () => {
    render(<ProgressStepper currentStep={5} totalSteps={5} />);

    expect(screen.getByText('Pytanie 5 z 5')).toBeInTheDocument();
  });

  it('should render correct number of step indicators', () => {
    const { container } = render(<ProgressStepper currentStep={3} totalSteps={5} />);

    const stepIndicators = container.querySelectorAll('.h-2');
    expect(stepIndicators).toHaveLength(5);
  });

  it('should mark completed steps with primary color', () => {
    const { container } = render(<ProgressStepper currentStep={3} totalSteps={5} />);

    const stepIndicators = container.querySelectorAll('.h-2');

    // Step 1 and 2 should be completed (primary color)
    expect(stepIndicators[0]).toHaveClass('bg-primary');
    expect(stepIndicators[1]).toHaveClass('bg-primary');

    // Step 3 is current (primary/60 color)
    expect(stepIndicators[2]).toHaveClass('bg-primary/60');

    // Step 4 and 5 are pending (muted color)
    expect(stepIndicators[3]).toHaveClass('bg-muted');
    expect(stepIndicators[4]).toHaveClass('bg-muted');
  });

  it('should mark current step with semi-transparent primary color', () => {
    const { container } = render(<ProgressStepper currentStep={1} totalSteps={5} />);

    const stepIndicators = container.querySelectorAll('.h-2');
    expect(stepIndicators[0]).toHaveClass('bg-primary/60');
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<ProgressStepper currentStep={2} totalSteps={3} />);

    expect(screen.getByLabelText('Pytanie 1 ukończone')).toBeInTheDocument();
    expect(screen.getByLabelText('Pytanie 2 aktualne')).toBeInTheDocument();
    expect(screen.getByLabelText('Pytanie 3 oczekuje')).toBeInTheDocument();
  });

  it('should handle single question correctly', () => {
    render(<ProgressStepper currentStep={1} totalSteps={1} />);

    expect(screen.getByText('Pytanie 1 z 1')).toBeInTheDocument();

    const { container } = render(<ProgressStepper currentStep={1} totalSteps={1} />);
    const stepIndicators = container.querySelectorAll('.h-2');

    expect(stepIndicators).toHaveLength(1);
    expect(stepIndicators[0]).toHaveClass('bg-primary/60');
  });

  it('should handle edge case of step 0', () => {
    const { container } = render(<ProgressStepper currentStep={0} totalSteps={5} />);

    const stepIndicators = container.querySelectorAll('.h-2');

    // All steps should be pending when currentStep is 0
    stepIndicators.forEach((indicator) => {
      expect(indicator).toHaveClass('bg-muted');
    });
  });

  it('should handle maximum steps correctly', () => {
    const { container } = render(<ProgressStepper currentStep={5} totalSteps={5} />);

    const stepIndicators = container.querySelectorAll('.h-2');

    // Steps 1-4 should be completed
    for (let i = 0; i < 4; i++) {
      expect(stepIndicators[i]).toHaveClass('bg-primary');
    }

    // Step 5 should be current
    expect(stepIndicators[4]).toHaveClass('bg-primary/60');
  });
});
